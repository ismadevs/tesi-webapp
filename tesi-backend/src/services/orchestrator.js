// ==========================================
// CONTROLLER DI ORCHESTRAZIONE
// ==========================================
// Osserva i documenti in attesa di materializzazione e li porta su SLICES-RI.
//
// PERCHE' E' UN COMPONENTE SEPARATO E NON UN ENDPOINT
// Il pulsante Deploy non invoca la CLI: si limita a scrivere DEPLOY_REQUESTED
// sul documento. Questo componente raccoglie la richiesta e agisce.
//
// La separazione ha tre conseguenze utili:
//   - la risposta HTTP e' immediata anche se il provisioning dura minuti
//   - l'intenzione e' persistente: sopravvive alla chiusura del browser e al
//     riavvio del backend, perche' e' un documento e non una chiamata
//   - lo stato dell'operazione e' osservabile da chiunque, non solo da chi ha
//     premuto il pulsante
//
// Con CouchDB questo ciclo a intervallo verra' sostituito dal changes feed,
// che notifica i cambiamenti invece di richiedere interrogazioni periodiche.
// La logica di materializzazione resta identica.

import { mockExperiments } from '../models/mockDatabase.js';
import Experiment, { EXPERIMENT_STATUS } from '../models/Experiment.js';
import * as slicesService from './slicesService.js';

// Intervallo di osservazione. Con il changes feed diventera' irrilevante,
// perche' la notifica arrivera' entro millisecondi dalla scrittura.
const POLL_INTERVAL_MS = 2000;

// Impedisce che due cicli si sovrappongano se una materializzazione dura piu'
// dell'intervallo. Con piu' istanze del backend servirebbe invece un lock
// condiviso, ed e' un limite dichiarato del prototipo.
let isProcessing = false;

// ==========================================
// ACCESSO AI DOCUMENTI
// ==========================================
// Equivale alla view CouchDB "esperimenti da elaborare".
const findPendingExperiments = () =>
  mockExperiments.filter((exp) => exp.status === EXPERIMENT_STATUS.DEPLOY_REQUESTED);

// Equivale a una PUT su CouchDB. Il documento viene ricostruito attraverso il
// modello per mantenere invarianti e struttura.
const updateExperiment = (id, changes) => {
  const index = mockExperiments.findIndex((exp) => exp.id === id);
  if (index === -1) return null;

  const updated = new Experiment({
    ...mockExperiments[index],
    ...changes,
    updatedAt: new Date().toISOString(),
  });

  mockExperiments[index] = updated;
  return updated;
};

// ==========================================
// MATERIALIZZAZIONE
// ==========================================

const deployExperiment = async (experiment) => {
  const { id, spec } = experiment;

  // Controllo di idempotenza: se il documento ha gia' un identificatore
  // remoto, e' gia' stato materializzato e la richiesta va ignorata.
  // Protegge dai casi in cui una richiesta venga rielaborata.
  if (experiment.remote.slicesExperimentId) {
    console.warn(`[orchestrator] ${spec.name} risulta già materializzato, ignoro.`);
    return;
  }

  console.log(`[orchestrator] Materializzazione di "${spec.name}" in corso`);

  // Presa in carico: distingue una richiesta in coda da una in lavorazione.
  // Senza questo passaggio non si potrebbe sapere se una richiesta giace
  // inevasa perche' l'orchestratore e' fermo.
  updateExperiment(id, { status: EXPERIMENT_STATUS.DEPLOYING });

  try {
    const { slicesExperimentId, elapsedMs } = await slicesService.createExperiment({
      name: spec.name,
      description: spec.description,
      duration: spec.duration,
    });

    // La scadenza viene calcolata localmente a partire dalla durata dichiarata.
    // E' un'approssimazione: il valore autorevole e' quello di SLICES, che
    // verra' letto quando aggiungeremo la lettura dello stato delle risorse.
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + durationToMs(spec.duration));

    updateExperiment(id, {
      status: EXPERIMENT_STATUS.DEPLOYED,
      error: null,
      remote: {
        slicesExperimentId,
        projectName: process.env.SLICES_PROJECT || 'tesi-unibo',
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
        deleted: false,
      },
    });

    console.log(`[orchestrator] "${spec.name}" creato in ${elapsedMs}ms → ${slicesExperimentId}`);

  } catch (error) {
    // Il messaggio proviene da stderr della CLI e spiega il motivo reale del
    // rifiuto: viene conservato nel documento e mostrato nell'interfaccia.
    console.error(`[orchestrator] "${spec.name}" fallito:`, error.message);

    updateExperiment(id, {
      status: EXPERIMENT_STATUS.FAILED,
      error: error.message,
    });
  }
};

// Conversione della durata dichiarata in millisecondi, per stimare la scadenza.
const durationToMs = (duration) => {
  const match = /^(\d+)([mhdw])$/.exec(duration);
  if (!match) return 0;

  const [, amount, unit] = match;
  const unitToMs = { m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return Number(amount) * unitToMs[unit];
};

// ==========================================
// CICLO DI OSSERVAZIONE
// ==========================================

const processPending = async () => {
  if (isProcessing) return;

  const pending = findPendingExperiments();
  if (pending.length === 0) return;

  isProcessing = true;
  try {
    // Sequenziale e non parallelo: le materializzazioni concorrenti
    // renderebbero difficile attribuire un eventuale errore, e su hardware
    // condiviso e' preferibile non inviare richieste a raffica.
    for (const experiment of pending) {
      await deployExperiment(experiment);
    }
  } finally {
    isProcessing = false;
  }
};

export const startOrchestrator = () => {
  console.log(`🔄 Orchestratore avviato (intervallo ${POLL_INTERVAL_MS}ms)`);
  setInterval(() => {
    processPending().catch((err) =>
      console.error('[orchestrator] Errore non gestito nel ciclo:', err)
    );
  }, POLL_INTERVAL_MS);
};