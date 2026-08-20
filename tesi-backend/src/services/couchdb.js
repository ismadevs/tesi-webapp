// ==========================================
// LAYER DI PERSISTENZA - COUCHDB
// ==========================================
// Unico punto del backend che parla con il database. I service usano queste
// funzioni e non sanno che sotto c'è HTTP, esattamente come non sapevano che
// prima c'era un array in memoria.
//
// PERCHE' fetch E NON UNA LIBRERIA
// CouchDB ha un'API puramente HTTP: leggere un documento è una GET, salvarlo
// è una PUT, interrogare un indice è una GET su un percorso particolare.
// Usare fetch rende visibile questa natura invece di mascherarla dietro
// un'astrazione, non aggiunge dipendenze, e mantiene il codice leggibile.
//
// IL CONTROLLO DI CONCORRENZA
// CouchDB non blocca nulla. Ogni documento porta un campo _rev, e ogni
// aggiornamento deve dichiarare su quale revisione si basa. Se nel frattempo
// qualcun altro ha scritto, la richiesta viene respinta con 409.
//
// È il motivo per cui il modello separa `spec` da `remote`: il frontend
// scrive solo la prima, l'orchestratore solo la seconda, quindi i due non si
// contendono mai lo stesso documento nello stesso istante.

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USER = process.env.COUCHDB_USER || 'admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'admin';
const DB_NAME = process.env.COUCHDB_DB || 'orchestrator';

const DB_URL = `${COUCHDB_URL}/${DB_NAME}`;

// Le credenziali viaggiano nell'intestazione Authorization con codifica Basic.
// Metterle nell'URL funzionerebbe, ma finirebbero nei log di qualunque proxy.
const authHeader =
  'Basic ' + Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');

// ==========================================
// ERRORI
// ==========================================

export class ConflictError extends Error {
  constructor(message = 'Document update conflict.') {
    super(message);
    this.name = 'CouchConflictError';
  }
}

export class DatabaseError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// ==========================================
// RICHIESTA DI BASE
// ==========================================

const request = async (path, options = {}) => {
  let response;

  try {
    response = await fetch(`${DB_URL}${path}`, {
      ...options,
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch (error) {
    // Errore di rete: il database non risponde. È diverso da una richiesta
    // rifiutata, e merita un messaggio che indichi la causa reale.
    throw new DatabaseError(
      `CouchDB non raggiungibile su ${COUCHDB_URL}. Verifica che il container sia avviato.`
    );
  }

  // 404 non è sempre un errore: chi chiama può volerlo distinguere.
  if (response.status === 404) return null;

  if (response.status === 409) {
    throw new ConflictError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new DatabaseError(
      `CouchDB ha risposto ${response.status}: ${body.reason || response.statusText}`
    );
  }

  return response.json();
};

// ==========================================
// OPERAZIONI SUI DOCUMENTI
// ==========================================

/**
 * Legge un documento. Restituisce null se non esiste.
 * Il documento include sempre _id e _rev.
 */
export const getDoc = (id) => request(`/${encodeURIComponent(id)}`);

/**
 * Crea o aggiorna un documento.
 *
 * Il documento deve contenere _id. Per un aggiornamento deve contenere anche
 * _rev: senza, CouchDB interpreta la richiesta come una creazione e risponde
 * 409 perché l'identificatore esiste già.
 *
 * Restituisce il documento con la nuova revisione, così chi chiama può
 * continuare a lavorarci senza rileggerlo.
 */
export const putDoc = async (doc) => {
  if (!doc._id) {
    throw new DatabaseError('Il documento deve contenere _id.');
  }

  const result = await request(`/${encodeURIComponent(doc._id)}`, {
    method: 'PUT',
    body: JSON.stringify(doc),
  });

  return { ...doc, _rev: result.rev };
};

/**
 * Elimina un documento.
 *
 * CouchDB non rimuove davvero il record: lascia una tombstone con _deleted
 * a true. È lo stesso comportamento del soft delete osservato su SLICES, e
 * serve alla replica per propagare la cancellazione ad altre istanze.
 */
export const deleteDoc = async (id, rev) => {
  await request(`/${encodeURIComponent(id)}?rev=${rev}`, { method: 'DELETE' });
  return true;
};

/**
 * Scrive più documenti in una sola richiesta.
 *
 * Utile per le operazioni a cascata, per esempio marcare tutte le risorse di
 * un esperimento. Attenzione: NON è una transazione. CouchDB elabora i
 * documenti uno per uno e restituisce l'esito di ciascuno, quindi alcuni
 * possono riuscire e altri fallire in conflitto.
 */
export const bulkDocs = async (docs) => {
  if (docs.length === 0) return [];

  const results = await request('/_bulk_docs', {
    method: 'POST',
    body: JSON.stringify({ docs }),
  });

  const failed = results.filter((r) => r.error);
  if (failed.length > 0) {
    throw new ConflictError(
      `Scrittura fallita per ${failed.length} documenti: ` +
      failed.map((f) => `${f.id} (${f.error})`).join(', ')
    );
  }

  return results;
};

// ==========================================
// INTERROGAZIONI
// ==========================================

/**
 * Interroga una view.
 *
 * Le view sono gli indici di CouchDB: funzioni che scorrono i documenti una
 * volta sola e producono coppie chiave-valore ordinate. Sostituiscono le
 * query SQL, con la differenza che vanno definite in anticipo.
 *
 * Con include_docs il risultato contiene il documento completo, evitando una
 * lettura per ogni riga.
 */
export const queryView = async (designDoc, viewName, params = {}) => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    // Le chiavi delle view sono valori JSON, non stringhe: una chiave
    // composta è un array, e anche una stringa semplice va virgolettata.
    query.set(key, typeof value === 'boolean' ? String(value) : JSON.stringify(value));
  }

  const result = await request(
    `/_design/${designDoc}/_view/${viewName}?${query.toString()}`
  );

  return result?.rows ?? [];
};

/**
 * Documenti restituiti da una view, già estratti dalle righe.
 */
export const queryDocs = async (designDoc, viewName, params = {}) => {
  const rows = await queryView(designDoc, viewName, { ...params, include_docs: true });
  return rows.map((row) => row.doc);
};

// ==========================================
// DIAGNOSTICA
// ==========================================

/**
 * Verifica che il database esista e sia raggiungibile.
 * Chiamata all'avvio del server per fallire subito con un messaggio chiaro
 * invece di scoprire il problema alla prima richiesta dell'utente.
 */
export const checkConnection = async () => {
  const info = await request('');

  if (!info) {
    throw new DatabaseError(
      `Il database "${DB_NAME}" non esiste. Crealo con: ` +
      `curl -X PUT ${COUCHDB_URL}/${DB_NAME}`
    );
  }

  return info;
};

export const DB_INFO = { url: COUCHDB_URL, name: DB_NAME };