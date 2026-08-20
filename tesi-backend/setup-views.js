/**
 * setup-views.js
 *
 * Carica su CouchDB i design document con le view, cioè gli indici usati per
 * interrogare i documenti.
 *
 * PERCHE' UNO SCRIPT E NON LA CREAZIONE MANUALE IN FAUXTON
 * Le view definiscono come i dati vengono interrogati: sono parte del codice
 * quanto un service. Tenerle in un file versionato significa che ricreare il
 * database da zero è un comando, e che una modifica alle interrogazioni
 * compare nella cronologia del repository.
 *
 * Esecuzione, dalla cartella del backend:
 *   node setup-views.js
 *
 * Va rilanciato ogni volta che una view viene modificata. È idempotente:
 * se il design document esiste già viene aggiornato, non duplicato.
 */

import dotenv from 'dotenv';
dotenv.config();

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USER = process.env.COUCHDB_USER || 'admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'admin';
const DB_NAME = process.env.COUCHDB_DB || 'orchestrator';

const DB_URL = `${COUCHDB_URL}/${DB_NAME}`;
const authHeader =
  'Basic ' + Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');

// ==========================================
// DESIGN DOCUMENT
// ==========================================
// Le funzioni map sono scritte come stringhe perché vengono eseguite da
// CouchDB, non da Node: il database le interpreta con il proprio motore
// JavaScript. Non possono quindi usare variabili esterne o import.
//
// Ogni funzione viene eseguita UNA VOLTA PER OGNI DOCUMENTO del database.
// Chiamando emit(chiave, valore) la riga entra nell'indice; non chiamandolo,
// il documento resta fuori. È così che si ottiene il filtro per tipo.

const designDocs = [
  {
    _id: '_design/experiments',
    views: {
      // Tutti gli esperimenti, ordinati per data di creazione.
      // Alimenta la tabella della sezione Experiments.
      //
      // La chiave è createdAt perché l'ordinamento di una view segue sempre
      // la chiave: emettendo la data si ottiene l'ordine cronologico senza
      // dover ordinare lato applicazione. Con descending=true si inverte.
      all: {
        map: `function (doc) {
          if (doc.type === 'experiment') {
            emit(doc.createdAt, null);
          }
        }`,
      },

      // Esperimenti raggruppati per stato.
      // Usata dall'orchestratore per trovare quelli in DEPLOY_REQUESTED.
      //
      // Si interroga con key="DEPLOY_REQUESTED": la view restituisce solo le
      // righe con quella chiave, senza scorrere gli altri documenti.
      by_status: {
        map: `function (doc) {
          if (doc.type === 'experiment') {
            emit(doc.status, null);
          }
        }`,
      },

      // Nomi degli esperimenti, per il controllo di unicità.
      //
      // Su SLICES il nome resta occupato anche dopo l'eliminazione, quindi la
      // verifica deve considerare TUTTI gli esperimenti. Interrogando con
      // key="nome-cercato" si sa in una richiesta se è già in uso, senza
      // caricare l'intero elenco in memoria.
      by_name: {
        map: `function (doc) {
          if (doc.type === 'experiment') {
            emit(doc.spec.name, null);
          }
        }`,
      },
    },
  },

  {
    _id: '_design/resources',
    views: {
      // Risorse di un esperimento, con chiave composta [experimentId, status].
      //
      // LA CHIAVE COMPOSTA COPRE DUE CASI CON UNA SOLA VIEW:
      //
      //   Tutte le risorse di un esperimento:
      //     startkey=["exp-0001"]&endkey=["exp-0001",{}]
      //     L'oggetto vuoto {} ordina dopo qualunque stringa nella
      //     collazione di CouchDB, quindi l'intervallo include ogni stato.
      //
      //   Solo quelle in bozza:
      //     key=["exp-0001","DRAFT"]
      //
      // È la sostituzione del doppio filter che il codice usava sugli array.
      by_experiment: {
        map: `function (doc) {
          if (doc.type === 'resource') {
            emit([doc.experimentId, doc.status], null);
          }
        }`,
      },

      // Risorse raggruppate per stato, indipendentemente dall'esperimento.
      // Usata dall'orchestratore per trovare quelle in DESTROY_REQUESTED.
      by_status: {
        map: `function (doc) {
          if (doc.type === 'resource') {
            emit(doc.status, null);
          }
        }`,
      },

      // Conteggio delle risorse per esperimento.
      //
      // La funzione reduce _count è predefinita in CouchDB ed è calcolata
      // in modo incrementale sull'indice: ottenere il numero di risorse di
      // un esperimento non richiede di caricarle. È il conteggio mostrato
      // nella tabella degli esperimenti.
      count_by_experiment: {
        map: `function (doc) {
          if (doc.type === 'resource') {
            emit(doc.experimentId, 1);
          }
        }`,
        reduce: '_count',
      },
    },
  },
];

// ==========================================
// CARICAMENTO
// ==========================================

const request = async (path, options = {}) => {
  const response = await fetch(`${DB_URL}${path}`, {
    ...options,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (response.status === 404) return null;

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${body.reason || response.statusText}`);
  }

  return body;
};

const uploadDesignDoc = async (doc) => {
  // Un design document è un documento come gli altri, quindi per aggiornarlo
  // serve la revisione corrente. Se non esiste ancora, la si omette e
  // CouchDB lo crea.
  const existing = await request(`/${encodeURIComponent(doc._id)}`);

  const payload = existing ? { ...doc, _rev: existing._rev } : doc;

  await request(`/${encodeURIComponent(doc._id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  const action = existing ? 'aggiornato' : 'creato';
  const viewNames = Object.keys(doc.views).join(', ');
  console.log(`✅ ${doc._id} ${action} — view: ${viewNames}`);
};

const main = async () => {
  console.log(`Caricamento delle view su ${DB_URL}\n`);

  try {
    // Verifica preliminare: un messaggio chiaro è meglio di un errore di rete
    // grezzo se il container è spento o il database non è stato creato.
    const info = await request('');
    if (!info) {
      throw new Error(
        `Il database "${DB_NAME}" non esiste. Crealo con: ` +
        `curl -X PUT ${DB_URL}`
      );
    }

    for (const doc of designDocs) {
      await uploadDesignDoc(doc);
    }

    console.log('\nFatto. Le view vengono costruite alla prima interrogazione,');
    console.log('quindi la prima richiesta può richiedere qualche istante.');
  } catch (error) {
    console.error(`\n❌ ${error.message}`);
    process.exitCode = 1;
  }
};

main();