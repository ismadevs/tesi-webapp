// ==========================================
// BUSINESS LOGIC LAYER (SERVICE) - RESOURCES
// ==========================================
// Regole del dominio per le risorse. La differenza rispetto agli esperimenti
// e' che qui la validazione dipende da due cose esterne: il catalogo, che
// determina quali combinazioni sono possibili, e lo stato dell'esperimento
// contenitore, che determina se l'operazione e' ammessa.

import { mockResources, mockExperiments } from '../models/mockDatabase.js';
import Resource, { RESOURCE_STATUS, LIVE_STATUSES } from '../models/Resource.js';
import { EXPERIMENT_STATUS } from '../models/Experiment.js';
import { infraForKind, findFlavor, findImage } from '../models/catalog.js';
import { ValidationError, NotFoundError, ConflictError } from '../utils/errors.js';

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const NAME_MAX_LENGTH = 60;

// ==========================================
// VALIDAZIONE DELL'ESPERIMENTO CONTENITORE
// ==========================================
// Ogni operazione di scrittura su una risorsa passa da qui. Sono i due
// controlli che rendono coerente l'intero modello:
//   - la risorsa deve appartenere a un esperimento esistente
//   - l'esperimento deve essere ancora una bozza
//
// Il secondo e' il vincolo centrale: dopo la materializzazione le risorse
// sono state allocate su hardware reale, e aggiungerne o rimuoverne dal
// documento non avrebbe alcun effetto sull'infrastruttura.
const requireDraftExperiment = (experimentId) => {
  const experiment = mockExperiments.find((exp) => exp.id === experimentId);

  if (!experiment) {
    throw new NotFoundError(`Esperimento "${experimentId}" non trovato.`);
  }

  if (experiment.status !== EXPERIMENT_STATUS.DRAFT) {
    throw new ConflictError(
      'Le risorse possono essere aggiunte o modificate solo finché ' +
      'l\'esperimento è in bozza. Questo esperimento è già stato ' +
      'materializzato su SLICES-RI.'
    );
  }

  return experiment;
};

// ==========================================
// VALIDAZIONE DELLA SPECIFICA
// ==========================================

const validateName = (name, experimentId, currentId = null) => {
  if (!name) {
    throw new ValidationError('Il nome della risorsa è obbligatorio.', 'name');
  }

  if (name.length > NAME_MAX_LENGTH) {
    throw new ValidationError(
      `Il nome non può superare ${NAME_MAX_LENGTH} caratteri.`, 'name'
    );
  }

  if (!NAME_PATTERN.test(name)) {
    throw new ValidationError(
      'Il nome può contenere solo lettere minuscole, cifre e trattini ' +
      '(esempio: vm-worker-1).',
      'name'
    );
  }

  // L'unicita' e' limitata all'esperimento, non globale: il nome diventa il
  // friendly_name della risorsa, e la piattaforma lo risolve nel contesto di
  // un singolo esperimento. Due esperimenti diversi possono contenere
  // entrambi una risorsa chiamata "vm-a".
  const duplicate = mockResources.find(
    (res) =>
      res.experimentId === experimentId &&
      res.spec.name === name &&
      res.id !== currentId
  );

  if (duplicate) {
    throw new ConflictError(
      `Questo esperimento contiene già una risorsa chiamata "${name}".`
    );
  }
};

// Il tipo viene dichiarato dall'utente, il sito ne viene derivato.
// E' il percorso inverso rispetto a SLICES, che dal sito deriva il tipo:
// l'interfaccia espone il concetto che l'utente ha in mente, e la traduzione
// verso il vocabolario della piattaforma avviene qui.
const resolveInfra = (kind) => {
  const infra = infraForKind(kind);

  if (!infra) {
    throw new ValidationError(
      'Tipo di risorsa non valido. Valori ammessi: vm, baremetal.', 'kind'
    );
  }

  return infra;
};

// Flavor e immagine non sono liberi: si scelgono da un catalogo, e i cataloghi
// dei due siti sono disgiunti. Validare qui evita che una combinazione
// impossibile arrivi fino alla CLI, dove fallirebbe con un errore molto meno
// comprensibile.
const validateCatalogChoice = (infra, flavor, image) => {
  if (!flavor) {
    throw new ValidationError('Il flavor è obbligatorio.', 'flavor');
  }

  if (!findFlavor(infra, flavor)) {
    throw new ValidationError(
      `Il flavor "${flavor}" non è disponibile su ${infra}.`, 'flavor'
    );
  }

  if (!image) {
    throw new ValidationError('L\'immagine disco è obbligatoria.', 'image');
  }

  if (!findImage(infra, image)) {
    throw new ValidationError(
      `L'immagine "${image}" non è disponibile su ${infra}.`, 'image'
    );
  }
};

const generateId = () => {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `res-${Date.now().toString(36)}-${suffix}`;
};

// Arricchisce il documento con i dati di catalogo, cosi' l'interfaccia puo'
// mostrare "tiny (1 vCPU, 1 GiB, 10 GB)" senza doverli cercare da sola.
const withFlavorDetails = (resource) => {
  // La scadenza è una condizione derivata, non uno stato memorizzato:
  // nessuno la scrive, si verifica al passare del tempo. Calcolarla alla
  // lettura evita di dover mantenere un processo che aggiorna i documenti.
  const isExpired =
    resource.status === RESOURCE_STATUS.DEPLOYED &&
    resource.remote.expiresAt !== null &&
    new Date(resource.remote.expiresAt) < new Date();

  return {
    ...resource,
    isDeployed: resource.remote.resourceId !== null,
    isExpired,
    isLive: LIVE_STATUSES.includes(resource.status) && !isExpired,
    flavorDetails: findFlavor(resource.spec.infra, resource.spec.flavor),
  };
};

// ==========================================
// OPERAZIONI
// ==========================================

/**
 * Elenco delle risorse, opzionalmente filtrate per esperimento.
 *
 * Il filtro riflette il vincolo della piattaforma: `slices bi list` richiede
 * obbligatoriamente --experiment, quindi una vista globale delle risorse non
 * ha corrispondenza in SLICES e va costruita iterando sugli esperimenti.
 */
export const getAllResources = (experimentId = null) => {
  const filtered = experimentId
    ? mockResources.filter((res) => res.experimentId === experimentId)
    : [...mockResources];

  return filtered
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .map(withFlavorDetails);
};

export const getResourceById = (id) => {
  const resource = mockResources.find((res) => res.id === id);
  if (!resource) {
    throw new NotFoundError(`Risorsa "${id}" non trovata.`);
  }
  return withFlavorDetails(resource);
};

/**
 * Crea una risorsa in stato DRAFT dentro un esperimento.
 * Nessuna interazione con SLICES: il documento esiste solo nella piattaforma
 * finché l'esperimento non viene materializzato.
 */
export const createResource = (data = {}) => {
  const experimentId = data.experimentId;
  const spec = data.spec || {};

  if (!experimentId) {
    throw new ValidationError(
      'Ogni risorsa deve appartenere a un esperimento.', 'experimentId'
    );
  }

  requireDraftExperiment(experimentId);

  const name = (spec.name ?? '').trim();
  const kind = spec.kind ?? 'vm';
  const infra = resolveInfra(kind);
  const flavor = spec.flavor ?? null;
  const image = spec.image ?? null;

  validateName(name, experimentId);
  validateCatalogChoice(infra, flavor, image);

  const resource = new Resource({
    id: generateId(),
    experimentId,
    spec: {
      name,
      kind,
      infra,
      flavor,
      image,
      publicIpv4: Boolean(spec.publicIpv4),
    },
    status: RESOURCE_STATUS.DRAFT,
  });

  mockResources.push(resource);
  return withFlavorDetails(resource);
};

/**
 * Aggiorna la specifica di una risorsa.
 * L'esperimento contenitore non e' modificabile: spostare una risorsa da un
 * esperimento all'altro non e' un'operazione che esiste in SLICES, perche'
 * fuori dal suo esperimento la risorsa non avrebbe esistenza.
 */
export const updateResource = (id, data = {}) => {
  const index = mockResources.findIndex((res) => res.id === id);
  if (index === -1) {
    throw new NotFoundError(`Risorsa "${id}" non trovata.`);
  }

  const current = mockResources[index];

  if (current.status !== RESOURCE_STATUS.DRAFT) {
    throw new ConflictError(
      'Solo le risorse in bozza possono essere modificate.'
    );
  }

  requireDraftExperiment(current.experimentId);

  const spec = data.spec || {};

  // Aggiornamento parziale: i campi non inviati mantengono il valore corrente.
  const name = spec.name !== undefined ? spec.name.trim() : current.spec.name;
  const kind = spec.kind !== undefined ? spec.kind : current.spec.kind;
  const infra = resolveInfra(kind);

  // Cambiando tipo, flavor e immagine precedenti diventano invalidi perché i
  // cataloghi dei due siti sono disgiunti. Vanno quindi rispecificati, e la
  // validazione sotto lo impone.
  const flavor = spec.flavor !== undefined ? spec.flavor : current.spec.flavor;
  const image = spec.image !== undefined ? spec.image : current.spec.image;

  const publicIpv4 = spec.publicIpv4 !== undefined
    ? Boolean(spec.publicIpv4)
    : current.spec.publicIpv4;

  validateName(name, current.experimentId, id);
  validateCatalogChoice(infra, flavor, image);

  const updated = new Resource({
    ...current,
    spec: { name, kind, infra, flavor, image, publicIpv4 },
    updatedAt: new Date().toISOString(),
  });

  mockResources[index] = updated;
  return withFlavorDetails(updated);
};

/**
 * Elimina la specifica di una risorsa.
 *
 * Come per gli esperimenti, la semantica e' quella di rimuovere il documento
 * dalla piattaforma, non di distruggere hardware su SLICES. Per questo
 * l'operazione e' ammessa solo sulle bozze.
 */
export const deleteResource = (id) => {
  const index = mockResources.findIndex((res) => res.id === id);
  if (index === -1) {
    throw new NotFoundError(`Risorsa "${id}" non trovata.`);
  }

  const current = mockResources[index];

  if (current.status !== RESOURCE_STATUS.DRAFT) {
    throw new ConflictError(
      'Solo le risorse in bozza possono essere eliminate. ' +
      'Le risorse allocate su SLICES-RI vengono liberate alla scadenza.'
    );
  }

  mockResources.splice(index, 1);
  return true;
};

/**
 * Richiede la distruzione di una risorsa allocata.
 *
 * ATTENZIONE ALLA SEMANTICA: qui si libera hardware reale su SLICES-RI,
 * operazione irreversibile. È cosa diversa da deleteResource, che rimuove
 * soltanto il documento di una bozza dalla piattaforma.
 *
 * Come per il deploy, la funzione non invoca la CLI: scrive lo stato
 * DESTROY_REQUESTED e ritorna. Sarà l'orchestratore a eseguire. La coerenza
 * fra le due operazioni non è formale: l'intenzione resta persistente e
 * sopravvive a un backend fermo o a un token scaduto.
 */
export const requestDestroy = (id) => {
  const index = mockResources.findIndex((res) => res.id === id);
  if (index === -1) {
    throw new NotFoundError(`Risorsa "${id}" non trovata.`);
  }

  const current = mockResources[index];

  if (current.status === RESOURCE_STATUS.DRAFT) {
    throw new ConflictError(
      'Questa risorsa è ancora una bozza e non esiste su SLICES-RI. ' +
      'Usa l\'eliminazione della bozza.'
    );
  }

  if (current.status === RESOURCE_STATUS.DESTROYED) {
    throw new ConflictError('Questa risorsa è già stata distrutta.');
  }

  if (!current.remote.resourceId) {
    throw new ConflictError(
      'Questa risorsa non è mai stata allocata su SLICES-RI.'
    );
  }

  const updated = new Resource({
    ...current,
    status: RESOURCE_STATUS.DESTROY_REQUESTED,
    updatedAt: new Date().toISOString(),
  });

  mockResources[index] = updated;
  return withFlavorDetails(updated);
};