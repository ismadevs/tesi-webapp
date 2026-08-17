import Experiment, { EXPERIMENT_STATUS } from './Experiment.js';

// ==========================================
// MOCK DATABASE
// ==========================================
// Simula la persistenza in attesa di CouchDB. Gli array sono in memoria:
// ogni riavvio del server ripristina questi dati iniziali.
//
// Sono deliberatamente pochi e scelti per coprire gli stati del ciclo di vita,
// cosi' l'interfaccia puo' essere verificata su tutti i casi senza dover
// materializzare nulla su SLICES.

// ==========================================
// ESPERIMENTI
// ==========================================
export let mockExperiments = [
  // Bozza: esiste solo nella piattaforma, tutti i campi remote sono nulli.
  // E' lo stato in cui nasce ogni esperimento creato dall'utente.
  new Experiment({
    id: 'exp-0001',
    spec: {
      name: 'latency-benchmark',
      description: 'Misura della latenza di risposta tra nodi su rete privata.',
      duration: '8h',
    },
    status: EXPERIMENT_STATUS.DRAFT,
    createdAt: '2026-08-01T09:15:00Z',
  }),

  // Bozza senza descrizione: verifica che il campo facoltativo sia gestito.
  new Experiment({
    id: 'exp-0002',
    spec: {
      name: 'k8s-scaling-test',
      description: '',
      duration: '24h',
    },
    status: EXPERIMENT_STATUS.DRAFT,
    createdAt: '2026-08-02T11:40:00Z',
  }),

  // Materializzato: i campi remote sono popolati con dati nel formato reale
  // restituito da SLICES, incluso l'identificatore lungo.
  new Experiment({
    id: 'exp-0003',
    spec: {
      name: 'sim-exp-2',
      description: 'Simulazione walking skeleton con due macchine virtuali.',
      duration: '2h',
    },
    status: EXPERIMENT_STATUS.DEPLOYED,
    remote: {
      slicesExperimentId: 'exp_expauth.ilabt.imec.be_01kz1p6j9ker1bd1jr5epb5m41',
      projectName: 'tesi-unibo',
      createdAt: '2026-08-02T16:51:30Z',
      expiresAt: '2026-08-02T18:51:00Z',
      deleted: false,
    },
    createdAt: '2026-08-02T16:45:00Z',
  }),

  // Fallito: mostra come il motivo dell'errore raggiunge l'interfaccia.
  // Il messaggio riproduce quello realmente restituito dalla CLI quando si
  // tenta di riusare un nome gia' occupato.
  new Experiment({
    id: 'exp-0004',
    spec: {
      name: 'sim-exp',
      description: 'Tentativo di materializzazione non riuscito.',
      duration: '2h',
    },
    status: EXPERIMENT_STATUS.FAILED,
    error: 'Bad Request: An active experiment with this name already exists.',
    createdAt: '2026-08-02T16:39:00Z',
  }),
];

// ==========================================
// RISORSE
// ==========================================
// Volutamente vuoto: il modello delle risorse verra' ricostruito da zero.
// In SLICES una risorsa non esiste al di fuori di un esperimento, quindi
// fara' riferimento all'esperimento contenitore tramite experimentId,
// e non viceversa come nella versione precedente.
export let mockResources = [];