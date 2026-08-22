// ==========================================
// BUSINESS LOGIC LAYER (SERVICE) - EXPERIMENTS
// ==========================================
// Contiene le regole del dominio: validazione, unicità dei nomi, vincoli
// sulle transizioni di stato. Non conosce HTTP e non formula risposte:
// in caso di violazione lancia un errore tipizzato che il controller traduce.
//
// PERSISTENZA
// I documenti vivono su CouchDB. Rispetto alla versione con array in memoria
// cambiano tre cose:
//   - tutte le funzioni sono asincrone, perché ogni accesso è una richiesta HTTP
//   - l'identificatore si chiama _id e c'è un campo _rev per la concorrenza
//   - i filtri sugli array diventano interrogazioni su view precostruite
//
// Il resto del backend non se ne accorge: controller, rotte e frontend
// restano invariati. È il vantaggio della separazione in livelli.

import * as db from './couchdb.js';
import Experiment, { EXPERIMENT_STATUS } from '../models/Experiment.js';
import Resource, { RESOURCE_STATUS } from '../models/Resource.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

// ==========================================
// VINCOLI DERIVATI DALLA PIATTAFORMA
// ==========================================

// Il nome finisce dentro identificatori e viene passato come argomento alla
// CLI: caratteri speciali e spazi creano problemi di quoting. Ammettiamo
// quindi solo minuscole, cifre e trattini.
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MAX_LENGTH = 60;

// La durata segue il formato accettato da SLICES: un numero seguito
// dall'unità (minuti, ore, giorni, settimane). Esempi validi: 30m, 2h, 1d.
const DURATION_PATTERN = /^(\d+)([mhdw])$/;

// Le risorse SLICES hanno un tetto di 2160 ore, pari a 90 giorni.
const MAX_DURATION_HOURS = 2160;

const UNIT_TO_HOURS = { m: 1 / 60, h: 1, d: 24, w: 168 };

// Stati in cui una risorsa esiste ancora o esisterà: sono quelli contati
// nella tabella. Le distrutte restano come storico ma non vanno conteggiate,
// altrimenti un esperimento le cui macchine sono state tutte liberate
// continuerebbe a dichiararne tre.
const COUNTABLE_RESOURCE_STATUSES = [
  RESOURCE_STATUS.DRAFT,
  RESOURCE_STATUS.DEPLOY_REQUESTED,
  RESOURCE_STATUS.DEPLOYING,
  RESOURCE_STATUS.DEPLOYED,
  RESOURCE_STATUS.DESTROY_REQUESTED,
  RESOURCE_STATUS.DESTROYING,
];

// ==========================================
// VALIDAZIONE
// ==========================================

const validateName = async (name, currentId = null) => {
  if (!name) {
    throw new ValidationError('Il nome dell\'esperimento è obbligatorio.', 'name');
  }

  if (name.length > NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Il nome non può superare ${NAME_MAX_LENGTH} caratteri.`, 'name'
    );
  }

  if (!NAME_PATTERN.test(name)) {
    throw new ValidationError(
      'Il nome può contenere solo lettere minuscole, cifre e trattini ' +
      '(esempio: latency-benchmark).',
      'name'
    );
  }

  // Su SLICES il nome resta occupato anche dopo l'eliminazione: verificato
  // sperimentalmente, la ricreazione con lo stesso nome viene rifiutata con
  // "An active experiment with this name already exists". Controllarlo qui
  // evita che l'utente scopra il conflitto solo a materializzazione fallita.
  //
  // La view by_name permette di interrogare per nome esatto: una richiesta
  // mirata invece di caricare tutti gli esperimenti per cercarne uno.
  const rows = await db.queryView('experiments', 'by_name', { key: name });
  const duplicate = rows.find((row) => row.id !== currentId);

  if (duplicate) {
    throw new ConflictError(
      `Esiste già un esperimento chiamato "${name}". ` +
      'Su SLICES il nome resta occupato anche dopo l\'eliminazione.'
    );
  }
};

const validateDuration = (duration) => {
  if (!duration) {
    throw new ValidationError('La durata è obbligatoria.', 'duration');
  }

  const match = DURATION_PATTERN.exec(duration);
  if (!match) {
    throw new ValidationError(
      'Formato durata non valido. Usa un numero seguito da m, h, d o w ' +
      '(esempio: 2h, 1d).',
      'duration'
    );
  }

  const [, amount, unit] = match;
  const hours = Number(amount) * UNIT_TO_HOURS[unit];

  if (hours <= 0) {
    throw new ValidationError('La durata deve essere maggiore di zero.', 'duration');
  }

  if (hours > MAX_DURATION_HOURS) {
    throw new ValidationError(
      `La durata non può superare ${MAX_DURATION_HOURS} ore (90 giorni), ` +
      'che è il limite imposto da SLICES-RI.',
      'duration'
    );
  }
};

// ==========================================
// CONTEGGIO DELLE RISORSE
// ==========================================
// Il conteggio non è un campo memorizzato ma un dato derivato: in SLICES la
// risorsa appartiene all'esperimento, quindi si contano quelle che vi fanno
// riferimento.
//
// La view by_experiment emette come chiave [experimentId, status]. Leggendo
// le sole chiavi, senza include_docs, si ottengono in UNA richiesta i
// conteggi di tutti gli esperimenti con un payload minimo: non servono i
// documenti, basta sapere quanti sono e in che stato.
const loadResourceCounts = async () => {
  const rows = await db.queryView('resources', 'by_experiment', {});
  const counts = new Map();

  for (const row of rows) {
    const [experimentId, status] = row.key;
    if (!COUNTABLE_RESOURCE_STATUSES.includes(status)) continue;
    counts.set(experimentId, (counts.get(experimentId) ?? 0) + 1);
  }

  return counts;
};

// ==========================================
// RAPPRESENTAZIONE VERSO L'API
// ==========================================
// Il frontend conosce il campo `id`, non `_id`. Tradurre qui evita di
// propagare la convenzione di CouchDB fino all'interfaccia, e permetterebbe
// di cambiare database senza toccare React.
const toApi = (doc, resourceCount = 0) => ({
  ...doc,
  id: doc._id,
  isDeployed: doc.remote.slicesExperimentId !== null,
  resourceCount,
});

const generateId = () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `exp-${Date.now().toString(36)}-${suffix}`;
};

// Lettura interna: restituisce il documento grezzo, con _rev, necessario per
// qualunque aggiornamento successivo.
const loadExperiment = async (id) => {
  const doc = await db.getDoc(id);

  if (!doc || doc.type !== 'experiment') {
    throw new NotFoundError(`Esperimento "${id}" non trovato.`);
  }

  return doc;
};

// ==========================================
// OPERAZIONI
// ==========================================

/**
 * Elenco completo degli esperimenti, dal più recente al più vecchio.
 * Include sia le bozze sia quelli materializzati: è la differenza rispetto
 * a `slices experiment list`, che conosce solo i secondi.
 *
 * L'ordinamento è fatto dalla view, che emette createdAt come chiave: con
 * descending si scorre l'indice al contrario senza ordinare in memoria.
 */
export const getAllExperiments = async () => {
  const [docs, counts] = await Promise.all([
    db.queryDocs('experiments', 'all', { descending: true }),
    loadResourceCounts(),
  ]);

  return docs.map((doc) => toApi(doc, counts.get(doc._id) ?? 0));
};

/**
 * Singolo esperimento per identificatore.
 */
export const getExperimentById = async (id) => {
  const doc = await loadExperiment(id);
  const counts = await loadResourceCounts();
  return toApi(doc, counts.get(id) ?? 0);
};

/**
 * Crea un esperimento in stato DRAFT.
 * Nessuna interazione con SLICES: il documento esiste solo nella piattaforma
 * finché l'utente non richiede esplicitamente la materializzazione.
 */
export const createExperiment = async (data = {}) => {
  const spec = data.spec || data;

  const name = (spec.name ?? '').trim();
  const description = (spec.description ?? '').trim();
  const duration = (spec.duration ?? '2h').trim();

  await validateName(name);
  validateDuration(duration);

  const experiment = new Experiment({
    _id: generateId(),
    spec: { name, description, duration },
    status: EXPERIMENT_STATUS.DRAFT,
  });

  const saved = await db.putDoc({ ...experiment });
  return toApi(saved, 0);
};

/**
 * Aggiorna la specifica di un esperimento.
 * Consentito solo in stato DRAFT: una specifica già applicata non può essere
 * modificata, perché il cambiamento non avrebbe alcun effetto sulle risorse
 * già allocate su SLICES.
 */
export const updateExperiment = async (id, data = {}) => {
  const current = await loadExperiment(id);

  if (current.status !== EXPERIMENT_STATUS.DRAFT) {
    throw new ConflictError(
      'Solo gli esperimenti in bozza possono essere modificati. ' +
      'Questo esperimento è già stato materializzato su SLICES-RI.'
    );
  }

  const spec = data.spec || data;

  // Aggiornamento parziale: i campi non inviati mantengono il valore corrente.
  const name = spec.name !== undefined ? spec.name.trim() : current.spec.name;
  const description = spec.description !== undefined
    ? spec.description.trim()
    : current.spec.description;
  const duration = spec.duration !== undefined
    ? spec.duration.trim()
    : current.spec.duration;

  // L'identificatore corrente viene escluso dal controllo di unicità,
  // altrimenti un salvataggio senza modifiche al nome verrebbe rifiutato.
  await validateName(name, id);
  validateDuration(duration);

  const updated = new Experiment({
    ...current,
    spec: { name, description, duration },
    updatedAt: new Date().toISOString(),
  });

  const saved = await db.putDoc({ ...updated });
  const counts = await loadResourceCounts();
  return toApi(saved, counts.get(id) ?? 0);
};

/**
 * Elimina il documento di un esperimento e delle sue risorse.
 *
 * ATTENZIONE ALLA SEMANTICA: qui si eliminano documenti dalla piattaforma,
 * non si distrugge nulla su SLICES. Sono due operazioni distinte, ed è il
 * motivo per cui l'eliminazione è limitata a due stati:
 *
 *   DRAFT      niente è mai stato allocato, quindi non c'è nulla da perdere
 *   DESTROYED  le macchine sono già state liberate, resta solo lo storico
 *
 * Su un esperimento ancora attivo sarebbe la situazione peggiore possibile:
 * macchine allocate su SLICES senza più alcuna traccia nella piattaforma,
 * quindi invisibili all'utente e recuperabili solo dalla CLI.
 */
export const deleteExperiment = async (id) => {
  const current = await loadExperiment(id);

  const removable = [EXPERIMENT_STATUS.DRAFT, EXPERIMENT_STATUS.DESTROYED];

  if (!removable.includes(current.status)) {
    throw new ConflictError(
      'Questo esperimento è attivo su SLICES-RI. Distruggilo prima di ' +
      'rimuoverlo dalla piattaforma.'
    );
  }

  // Cancellazione a cascata delle risorse collegate.
  //
  // È sicura perché il controllo sopra limita l'operazione a due casi in cui
  // nulla è allocato: bozze mai materializzate, oppure risorse già liberate.
  //
  // L'intervallo di chiavi copre tutti gli stati: l'oggetto vuoto ordina
  // dopo qualunque stringa nella collazione di CouchDB.
  const resources = await db.queryDocs('resources', 'by_experiment', {
    startkey: [id],
    endkey: [id, {}],
  });

  if (resources.length > 0) {
    // In CouchDB si cancella marcando _deleted: il documento non sparisce
    // davvero ma lascia una tombstone, meccanismo necessario perché la
    // cancellazione si propaghi in caso di replica.
    await db.bulkDocs(
      resources.map((doc) => ({ _id: doc._id, _rev: doc._rev, _deleted: true }))
    );
  }

  await db.deleteDoc(current._id, current._rev);
  return true;
};

/**
 * Richiede la materializzazione su SLICES-RI.
 *
 * Non contatta l'infrastruttura: si limita a portare il documento in stato
 * DEPLOY_REQUESTED. Sarà il controller di orchestrazione a raccogliere la
 * richiesta e a invocare la CLI. La separazione è voluta: l'intenzione è
 * persistente e sopravvive alla chiusura del browser o all'arresto del
 * controller, invece di essere una chiamata effimera.
 */
export const requestDeploy = async (id) => {
  const current = await loadExperiment(id);

  // Controllo di idempotenza: se ha già un identificatore remoto,
  // l'esperimento è già stato materializzato.
  if (current.remote.slicesExperimentId !== null) {
    throw new ConflictError('Questo esperimento è già stato materializzato su SLICES-RI.');
  }

  // Da FAILED si può ritentare, da DRAFT si parte: gli altri stati indicano
  // un deploy già in corso.
  const deployable = [EXPERIMENT_STATUS.DRAFT, EXPERIMENT_STATUS.FAILED];
  if (!deployable.includes(current.status)) {
    throw new ConflictError(
      `Un deploy è già in corso (stato attuale: ${current.status}).`
    );
  }

  const updated = new Experiment({
    ...current,
    status: EXPERIMENT_STATUS.DEPLOY_REQUESTED,
    error: null,
    updatedAt: new Date().toISOString(),
  });

  const saved = await db.putDoc({ ...updated });
  const counts = await loadResourceCounts();
  return toApi(saved, counts.get(id) ?? 0);
};

/**
 * Duplica un esperimento e le sue risorse come nuove bozze.
 *
 * È l'operazione che rende la specifica effettivamente riutilizzabile: un
 * esperimento scaduto conserva la propria configurazione, e duplicarlo
 * permette di rieseguirlo identico senza ricostruire nulla.
 *
 * Nessuna interazione con SLICES: si copiano documenti. Per questo è
 * consentita in qualunque stato, incluso FAILED, dove il fallimento più
 * frequente è proprio il nome già occupato.
 */
export const duplicateExperiment = async (id) => {
  const source = await loadExperiment(id);

  // Il nome deve essere univoco fra TUTTI gli esperimenti, anche quelli
  // eliminati. Si parte dalla radice, togliendo un eventuale suffisso di
  // copia precedente, così duplicando una copia non si ottiene "x-copy-copy".
  const base = source.spec.name.replace(/-copy(-\d+)?$/, '').slice(0, 50);

  const rows = await db.queryView('experiments', 'by_name', {});
  const taken = new Set(rows.map((row) => row.key));

  let name = `${base}-copy`;
  let counter = 2;
  while (taken.has(name)) {
    name = `${base}-copy-${counter}`;
    counter++;
  }

  const experiment = new Experiment({
    _id: generateId(),
    spec: {
      name,
      description: source.spec.description,
      duration: source.spec.duration,
    },
    status: EXPERIMENT_STATUS.DRAFT,
  });

  await db.putDoc({ ...experiment });

  // Si copiano tutte le risorse della specifica originale, comprese quelle
  // distrutte: la copia rappresenta la configurazione com'era stata
  // concepita, non lo stato in cui si trova adesso.
  const sourceResources = await db.queryDocs('resources', 'by_experiment', {
    startkey: [id],
    endkey: [id, {}],
  });

  if (sourceResources.length > 0) {
    const copies = sourceResources.map((resource) => ({
      ...new Resource({
        _id: `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        experimentId: experiment._id,
        // Solo la spec viene copiata: i campi remote appartengono a una
        // macchina che è esistita, e la copia non ne ha ancora nessuna.
        spec: { ...resource.spec },
        status: RESOURCE_STATUS.DRAFT,
      }),
    }));

    await db.bulkDocs(copies);
  }

  return toApi(experiment, sourceResources.length);
};

/**
 * Richiede la distruzione di un esperimento materializzato.
 *
 * ATTENZIONE ALLA SEMANTICA: libera hardware reale su SLICES-RI, operazione
 * irreversibile. È cosa diversa da deleteExperiment, che rimuove soltanto il
 * documento dalla piattaforma.
 *
 * `slices experiment delete` porta via anche tutte le risorse contenute,
 * quindi basta una sola invocazione: l'orchestratore marcherà poi le risorse
 * come distrutte di conseguenza.
 */
export const requestDestroy = async (id) => {
  const current = await loadExperiment(id);

  if (!current.remote.slicesExperimentId) {
    throw new ConflictError(
      'Questo esperimento non è mai stato materializzato su SLICES-RI. ' +
      'Usa l\'eliminazione della bozza.'
    );
  }

  if (current.status === EXPERIMENT_STATUS.DESTROYED) {
    throw new ConflictError('Questo esperimento è già stato distrutto.');
  }

  const destroyable = [EXPERIMENT_STATUS.DEPLOYED, EXPERIMENT_STATUS.FAILED];
  if (!destroyable.includes(current.status)) {
    throw new ConflictError(
      `Operazione non consentita nello stato attuale (${current.status}).`
    );
  }

  const updated = new Experiment({
    ...current,
    status: EXPERIMENT_STATUS.DESTROY_REQUESTED,
    updatedAt: new Date().toISOString(),
  });

  const saved = await db.putDoc({ ...updated });
  const counts = await loadResourceCounts();
  return toApi(saved, counts.get(id) ?? 0);
};