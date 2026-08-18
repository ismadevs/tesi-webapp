import Experiment, { EXPERIMENT_STATUS } from './Experiment.js';
import Resource, { RESOURCE_STATUS } from './Resource.js';

// ==========================================
// MOCK DATABASE
// ==========================================
// Simula la persistenza in attesa di CouchDB. Gli array sono in memoria:
// ogni riavvio del server ripristina questi dati iniziali, e quanto creato
// durante la sessione viene perso.
//
// I dati sono pochi e scelti per coprire tutti gli stati del ciclo di vita,
// cosi' l'interfaccia puo' essere verificata su ogni caso senza dover
// materializzare nulla su SLICES.

// ==========================================
// ESPERIMENTI
// ==========================================
export let mockExperiments = [
  // Bozza con risorse: e' il caso principale da testare.
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

  // Bozza vuota: verifica lo stato senza risorse e il blocco del deploy.
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
  // restituito da SLICES. Le sue risorse non sono piu' modificabili.
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

  // Fallito: il messaggio riproduce quello realmente restituito dalla CLI
  // quando si tenta di riusare un nome gia' occupato.
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
// La risorsa punta al suo esperimento tramite l'identificatore LOCALE:
// la relazione deve valere anche prima del deploy, quando l'identificatore
// SLICES non esiste ancora.
export let mockResources = [
  // Due bozze dentro l'esperimento in bozza: modificabili ed eliminabili.
  new Resource({
    id: 'res-0001',
    experimentId: 'exp-0001',
    spec: {
      name: 'node-a',
      kind: 'vm',
      infra: 'be-gent1-bi-vm1',
      flavor: 'tiny',
      image: 'Ubuntu 24.04.4',
      publicIpv4: false,
    },
    status: RESOURCE_STATUS.DRAFT,
    createdAt: '2026-08-01T09:20:00Z',
  }),

  new Resource({
    id: 'res-0002',
    experimentId: 'exp-0001',
    spec: {
      name: 'node-b',
      kind: 'vm',
      infra: 'be-gent1-bi-vm1',
      flavor: 'small',
      image: 'Debian 13.5',
      publicIpv4: true,
    },
    status: RESOURCE_STATUS.DRAFT,
    createdAt: '2026-08-01T09:22:00Z',
  }),

  // Risorsa materializzata: i dati remote sono quelli reali osservati nel
  // test del walking skeleton. Nota che publicIpv4 e' nullo e l'accesso SSH
  // avviene su indirizzo privato attraverso un bastion host.
  new Resource({
    id: 'res-0003',
    experimentId: 'exp-0003',
    spec: {
      name: 'vm-a',
      kind: 'vm',
      infra: 'be-gent1-bi-vm1',
      flavor: 'tiny',
      image: 'Ubuntu 24.04.4',
      publicIpv4: false,
    },
    status: RESOURCE_STATUS.DEPLOYED,
    remote: {
      resourceId: 'r_be-gent1-bi-vm1_01kz1p6m81e2t9pdqdw3bpvmqb',
      slicesStatus: 'up',
      publicIpv4: null,
      privateIpv4: '10.10.217.148',
      consoleUrl: 'https://console-gent1.slices-be.eu/exp_expauth.ilabt.imec.be_01kz1p6j9ker1bd1jr5epb5m41/r_be-gent1-bi-vm1_01kz1p6m81e2t9pdqdw3bpvmqb/',
      sshLogin: {
        host: '10.10.217.148',
        port: 22,
        username: 'ubuntu',
        jumpProxy: { host: 'bastion2.slices-be.eu', port: 22, username: 'proxy' },
      },
      createdAt: '2026-08-02T16:51:33Z',
      expiresAt: '2026-08-02T18:51:00Z',
      terminatedAt: null,
      failureReason: null,
    },
    createdAt: '2026-08-02T16:46:00Z',
  }),

  new Resource({
    id: 'res-0004',
    experimentId: 'exp-0003',
    spec: {
      name: 'vm-b',
      kind: 'vm',
      infra: 'be-gent1-bi-vm1',
      flavor: 'tiny',
      image: 'Ubuntu 24.04.4',
      publicIpv4: false,
    },
    status: RESOURCE_STATUS.DEPLOYED,
    remote: {
      resourceId: 'r_be-gent1-bi-vm1_01kz1p6m81efybyqbb893pyyqg',
      slicesStatus: 'up',
      publicIpv4: null,
      privateIpv4: '10.10.220.226',
      consoleUrl: 'https://console-gent1.slices-be.eu/exp_expauth.ilabt.imec.be_01kz1p6j9ker1bd1jr5epb5m41/r_be-gent1-bi-vm1_01kz1p6m81efybyqbb893pyyqg/',
      sshLogin: {
        host: '10.10.220.226',
        port: 22,
        username: 'ubuntu',
        jumpProxy: { host: 'bastion2.slices-be.eu', port: 22, username: 'proxy' },
      },
      createdAt: '2026-08-02T16:51:33Z',
      expiresAt: '2026-08-02T18:51:00Z',
      terminatedAt: null,
      failureReason: null,
    },
    createdAt: '2026-08-02T16:46:00Z',
  }),
];