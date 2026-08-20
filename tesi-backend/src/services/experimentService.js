// ==========================================
// BUSINESS LOGIC LAYER (SERVICE) - EXPERIMENTS
// ==========================================
// Contiene le regole del dominio: validazione, unicita' dei nomi, vincoli
// sulle transizioni di stato. Non conosce HTTP e non formula risposte:
// in caso di violazione lancia un errore tipizzato che il controller traduce.

import { mockExperiments, mockResources } from '../models/mockDatabase.js';
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
// dall'unita' (minuti, ore, giorni, settimane). Esempi validi: 30m, 2h, 1d.
const DURATION_PATTERN = /^(\d+)([mhdw])$/;

// Le risorse SLICES hanno un tetto di 2160 ore, pari a 90 giorni.
const MAX_DURATION_HOURS = 2160;

const UNIT_TO_HOURS = { m: 1 / 60, h: 1, d: 24, w: 168 };

// ==========================================
// VALIDAZIONE
// ==========================================

const validateName = (name, currentId = null) => {
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
  const duplicate = mockExperiments.find(
    (exp) => exp.spec.name === name && exp.id !== currentId
  );

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
// ARRICCHIMENTO PER IL LIVELLO DI PRESENTAZIONE
// ==========================================
// Il conteggio delle risorse non e' un campo memorizzato ma un dato derivato:
// in SLICES la risorsa appartiene all'esperimento, quindi si contano le risorse
// che vi fanno riferimento. Calcolarlo qui evita che il frontend debba
// interrogare due endpoint per riempire una colonna della tabella.
const LIVE = ['DEPLOY_REQUESTED', 'DEPLOYING', 'DEPLOYED', 'DESTROY_REQUESTED', 'DESTROYING'];

const withResourceCount = (experiment) => {
  const all = mockResources.filter((r) => r.experimentId === experiment.id);

  return {
    ...experiment,
    isDeployed: experiment.remote.slicesExperimentId !== null,
    // Le bozze contano come vive: esistono nella piattaforma e verranno
    // materializzate. Le distrutte no: restano solo come storico.
    resourceCount: all.filter(
      (r) => r.status === 'DRAFT' || LIVE.includes(r.status)
    ).length,
    totalResourceCount: all.length,
  };
};

// Generazione dell'identificatore locale. Con CouchDB diventera' il campo _id;
// il formato con prefisso rende leggibile il tipo di documento.
const generateId = () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `exp-${Date.now().toString(36)}-${suffix}`;
};

// ==========================================
// OPERAZIONI
// ==========================================

/**
 * Elenco completo degli esperimenti, dal piu' recente al piu' vecchio.
 * Include sia le bozze sia quelli materializzati: e' la differenza rispetto
 * a `slices experiment list`, che conosce solo i secondi.
 */
export const getAllExperiments = () => {
  return [...mockExperiments]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(withResourceCount);
};

/**
 * Singolo esperimento per identificatore locale.
 */
export const getExperimentById = (id) => {
  const experiment = mockExperiments.find((exp) => exp.id === id);
  if (!experiment) {
    throw new NotFoundError(`Esperimento "${id}" non trovato.`);
  }
  return withResourceCount(experiment);
};

/**
 * Crea un esperimento in stato DRAFT.
 * Nessuna interazione con SLICES: il documento esiste solo nella piattaforma
 * finche' l'utente non richiede esplicitamente la materializzazione.
 */
export const createExperiment = (data = {}) => {
  const spec = data.spec || data;

  const name = (spec.name ?? '').trim();
  const description = (spec.description ?? '').trim();
  const duration = (spec.duration ?? '2h').trim();

  validateName(name);
  validateDuration(duration);

  const experiment = new Experiment({
    id: generateId(),
    spec: { name, description, duration },
    status: EXPERIMENT_STATUS.DRAFT,
  });

  mockExperiments.push(experiment);
  return withResourceCount(experiment);
};

/**
 * Aggiorna la specifica di un esperimento.
 * Consentito solo in stato DRAFT: una specifica gia' applicata non puo' essere
 * modificata, perche' il cambiamento non avrebbe alcun effetto sulle risorse
 * gia' allocate su SLICES.
 */
export const updateExperiment = (id, data = {}) => {
  const index = mockExperiments.findIndex((exp) => exp.id === id);
  if (index === -1) {
    throw new NotFoundError(`Esperimento "${id}" non trovato.`);
  }

  const current = mockExperiments[index];

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

  // L'identificatore corrente viene escluso dal controllo di unicita',
  // altrimenti un salvataggio senza modifiche al nome verrebbe rifiutato.
  validateName(name, id);
  validateDuration(duration);

  const updated = new Experiment({
    ...current,
    spec: { name, description, duration },
    updatedAt: new Date().toISOString(),
  });

  mockExperiments[index] = updated;
  return withResourceCount(updated);
};

/**
 * Elimina la specifica di un esperimento.
 *
 * ATTENZIONE ALLA SEMANTICA: qui si elimina il documento dalla piattaforma,
 * non si distrugge nulla su SLICES. Sono due operazioni distinte, e per questo
 * l'eliminazione e' ammessa solo sulle bozze: cancellare il documento di un
 * esperimento materializzato lascerebbe le macchine allocate senza piu' alcuna
 * traccia nella piattaforma, che e' la situazione peggiore possibile.
 */
export const deleteExperiment = (id) => {
  const index = mockExperiments.findIndex((exp) => exp.id === id);
  if (index === -1) {
    throw new NotFoundError(`Esperimento "${id}" non trovato.`);
  }

  const current = mockExperiments[index];

  if (current.status !== EXPERIMENT_STATUS.DRAFT) {
    throw new ConflictError(
      'Solo gli esperimenti in bozza possono essere eliminati. ' +
      'Le risorse già allocate su SLICES-RI vengono liberate alla scadenza.'
    );
  }

    // Le risorse in bozza vengono rimosse insieme all'esperimento: sono
  // documenti che esistono solo nella piattaforma, quindi non c'è nulla di
  // irreversibile da proteggere. Chiedere all'utente di svuotare a mano un
  // contenitore che sta per eliminare sarebbe un passaggio inutile.
  //
  // La cancellazione a cascata è sicura solo perché la funzione è già
  // limitata alle bozze dal controllo sopra: su un esperimento materializzato
  // ci sarebbero macchine allocate, e rimuoverne i documenti le lascerebbe
  // attive senza più traccia nella piattaforma.
  for (let i = mockResources.length - 1; i >= 0; i--) {
    if (mockResources[i].experimentId === id) {
      mockResources.splice(i, 1);
    }
  }

  mockExperiments.splice(index, 1);
  return true;
};

/**
 * Richiede la materializzazione su SLICES-RI.
 *
 * Non contatta l'infrastruttura: si limita a portare il documento in stato
 * DEPLOY_REQUESTED. Sara' il controller di orchestrazione a raccogliere la
 * richiesta e a invocare la CLI. La separazione e' voluta: l'intenzione e'
 * persistente e sopravvive alla chiusura del browser o all'arresto del
 * controller, invece di essere una chiamata effimera.
 */
export const requestDeploy = (id) => {
  const index = mockExperiments.findIndex((exp) => exp.id === id);
  if (index === -1) {
    throw new NotFoundError(`Esperimento "${id}" non trovato.`);
  }

  const current = mockExperiments[index];

  // Controllo di idempotenza: se ha gia' un identificatore remoto,
  // l'esperimento e' gia' stato materializzato.
  if (current.remote.slicesExperimentId !== null) {
    throw new ConflictError('Questo esperimento è già stato materializzato su SLICES-RI.');
  }

  // Da FAILED si puo' ritentare, da DRAFT si parte: gli altri stati indicano
  // un deploy gia' in corso.
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

  mockExperiments[index] = updated;
  return withResourceCount(updated);
};

/**
 * Duplica un esperimento e le sue risorse come nuove bozze.
 *
 * È l'operazione che rende la specifica effettivamente riutilizzabile:
 * un esperimento scaduto conserva la propria configurazione, e duplicarlo
 * permette di rieseguirlo identico senza ricostruire nulla.
 *
 * Nessuna interazione con SLICES: si copiano documenti. Per questo è
 * consentita in qualunque stato, incluso FAILED, dove il fallimento più
 * frequente è proprio il nome già occupato.
 */
export const duplicateExperiment = (id) => {
  const source = mockExperiments.find((exp) => exp.id === id);
  if (!source) {
    throw new NotFoundError(`Esperimento "${id}" non trovato.`);
  }

  // Il nome deve essere univoco fra TUTTI gli esperimenti, anche quelli
  // eliminati: su SLICES il nome resta riservato dopo la cancellazione.
  // Si parte dalla radice, togliendo un eventuale suffisso di copia
  // precedente, così duplicando una copia non si ottiene "x-copy-copy".
  const base = source.spec.name.replace(/-copy(-\d+)?$/, '').slice(0, 50);
  const taken = new Set(mockExperiments.map((exp) => exp.spec.name));

  let name = `${base}-copy`;
  let counter = 2;
  while (taken.has(name)) {
    name = `${base}-copy-${counter}`;
    counter++;
  }

  const experiment = new Experiment({
    id: generateId(),
    spec: {
      name,
      description: source.spec.description,
      duration: source.spec.duration,
    },
    status: EXPERIMENT_STATUS.DRAFT,
  });

  mockExperiments.push(experiment);

  // Si copiano tutte le risorse della specifica originale, comprese quelle
  // distrutte: la copia rappresenta la configurazione com'era stata
  // concepita, non lo stato in cui si trova adesso.
  const sourceResources = mockResources.filter((res) => res.experimentId === id);

  for (const resource of sourceResources) {
    mockResources.push(new Resource({
      id: `res-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      experimentId: experiment.id,
      // Solo la spec viene copiata: i campi remote appartengono a una
      // macchina che è esistita, e la copia non ne ha ancora nessuna.
      spec: { ...resource.spec },
      status: RESOURCE_STATUS.DRAFT,
    }));
  }

  return withResourceCount(experiment);
};