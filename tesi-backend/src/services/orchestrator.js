// ==========================================
// CONTROLLER DI ORCHESTRAZIONE
// ==========================================
// Osserva i documenti in attesa di materializzazione e li porta su SLICES-RI
// insieme alle risorse che contengono.
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
// Con CouchDB il ciclo a intervallo verra' sostituito dal changes feed, che
// notifica i cambiamenti invece di richiedere interrogazioni periodiche.
// La logica di materializzazione restera' identica.

import { mockExperiments, mockResources } from '../models/mockDatabase.js';
import Experiment, { EXPERIMENT_STATUS } from '../models/Experiment.js';
import Resource, { RESOURCE_STATUS } from '../models/Resource.js';
import * as slicesService from './slicesService.js';

// Ogni quanto cercare richieste di deploy.
const POLL_INTERVAL_MS = 2000;

// Ogni quanto interrogare lo stato delle risorse durante il provisioning.
// Cinque secondi e non meno: ogni invocazione della CLI costa centinaia di
// millisecondi per l'avvio dell'interprete Python, e l'allocazione richiede
// comunque decine di secondi.
const RESOURCE_POLL_MS = 5000;

// Oltre questa soglia si rinuncia ad attendere. Serve a evitare che
// l'orchestratore resti bloccato su una risorsa che non arrivera' mai.
const PROVISIONING_TIMEOUT_MS = 600000;

let isProcessing = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const log = (msg) => console.log(`[orchestrator] ${msg}`);

// ==========================================
// ACCESSO AI DOCUMENTI
// ==========================================
// Equivalgono alle view e alle scritture di CouchDB. Sostituendo queste
// funzioni si passa alla persistenza reale senza toccare la logica sotto.

const findPendingExperiments = () =>
  mockExperiments.filter((exp) => exp.status === EXPERIMENT_STATUS.DEPLOY_REQUESTED);

const findDraftResources = (experimentId) =>
  mockResources.filter(
    (res) => res.experimentId === experimentId && res.status === RESOURCE_STATUS.DRAFT
  );

const updateExperiment = (id, changes) => {
  const index = mockExperiments.findIndex((exp) => exp.id === id);
  if (index === -1) return null;

  mockExperiments[index] = new Experiment({
    ...mockExperiments[index],
    ...changes,
    updatedAt: new Date().toISOString(),
  });

  return mockExperiments[index];
};

const updateResource = (id, changes) => {
  const index = mockResources.findIndex((res) => res.id === id);
  if (index === -1) return null;

  mockResources[index] = new Resource({
    ...mockResources[index],
    ...changes,
    updatedAt: new Date().toISOString(),
  });

  return mockResources[index];
};

// ==========================================
// UTILITA'
// ==========================================

const durationToMs = (duration) => {
  const match = /^(\d+)([mhdw])$/.exec(duration);
  if (!match) return 0;

  const [, amount, unit] = match;
  const unitToMs = { m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return Number(amount) * unitToMs[unit];
};

// ==========================================
// SCELTA DELLA STRATEGIA
// ==========================================
// Due interfacce della stessa API con capacita' diverse:
//   - `create-from-file` crea tutte le risorse in una invocazione, ma la
//     specifica JSON rifiuta il campo public_ipv4
//   - `bi create` accetta --public-ipv4, ma va invocato una volta per risorsa
//
// La piattaforma compensa la discrepanza invece di ereditarne il limite:
// sceglie il comando adatto in base a cio' che l'esperimento contiene.
//
// La regola e' tutto o niente per esperimento. Un approccio ibrido (blocco
// per le risorse senza indirizzo pubblico, singole per le altre) sarebbe piu'
// efficiente, ma introdurrebbe due superfici di errore nello stesso deploy e
// renderebbe non confrontabili le misure di tempo. E' citato come possibile
// ottimizzazione.
const chooseStrategy = (resources) =>
  resources.some((r) => r.spec.publicIpv4) ? 'individual' : 'batch';

// ==========================================
// CREAZIONE DELLE RISORSE
// ==========================================

const createResourcesBatch = async (slicesExperimentId, resources, duration) => {
  log(`Strategia a blocco: 1 invocazione per ${resources.length} risorse`);

  const { elapsedMs } = await slicesService.createResourcesFromFile({
    experimentId: slicesExperimentId,
    resources,
    duration,
  });

  return { elapsedMs, invocations: 1 };
};

const createResourcesIndividually = async (slicesExperimentId, resources, duration) => {
  log(`Strategia singola: ${resources.length} invocazioni (IP pubblico richiesto)`);

  const startedAt = Date.now();

  // Sequenziale e non parallelo: su hardware condiviso e' preferibile non
  // inviare richieste a raffica, e in caso di errore si sa esattamente quale
  // risorsa lo ha causato.
  for (const resource of resources) {
    try {
      await slicesService.createResource({
        experimentId: slicesExperimentId,
        infra: resource.spec.infra,
        name: resource.spec.name,
        flavor: resource.spec.flavor,
        image: resource.spec.image,
        duration,
        publicIpv4: resource.spec.publicIpv4,
      });
    } catch (error) {
      // La risorsa che ha fallito viene marcata individualmente, cosi'
      // l'interfaccia mostra quale delle N non e' stata creata.
      updateResource(resource.id, {
        status: RESOURCE_STATUS.FAILED,
        remote: { ...resource.remote, failureReason: error.message },
      });
      throw error;
    }
  }

  return { elapsedMs: Date.now() - startedAt, invocations: resources.length };
};

// ==========================================
// ATTESA DEL PROVISIONING
// ==========================================
// L'allocazione e' asincrona: il comando di creazione ritorna in pochi
// secondi, ma le macchine attraversano una sequenza di stati prima di essere
// utilizzabili (imaging, booting, initializing, up).
//
// Durante l'attesa gli stati intermedi vengono scritti nei documenti: e' cio'
// che alimenta la progressione a quattro tappe mostrata sulle card. Senza
// queste scritture l'interfaccia resterebbe ferma per tutta la durata.
const waitForResources = async (slicesExperimentId, resources) => {
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt < PROVISIONING_TIMEOUT_MS) {
    attempt++;

    const remoteResources = await slicesService.listResources(slicesExperimentId);

    // Le risorse si riconciliano per friendly_name: la creazione a blocco non
    // restituisce identificatori associabili, quindi il nome dichiarato e'
    // l'unico aggancio disponibile fra documento e risorsa remota.
    for (const resource of resources) {
      const remote = remoteResources.find((r) => r.friendly_name === resource.spec.name);
      if (!remote) continue;

      updateResource(resource.id, {
        remote: {
          ...resource.remote,
          resourceId: remote.id,
          // Lo stato reale e' minuscolo: la tabella della CLI lo mostra
          // capitalizzato solo per presentazione.
          slicesStatus: remote.status,
          publicIpv4: remote.public_ipv4 ?? null,
          privateIpv4: remote.private_ipv4 ?? remote.ssh_logins?.[0]?.host ?? null,
          consoleUrl: remote.console_url ?? null,
          sshLogin: remote.ssh_logins?.[0]
            ? {
                host: remote.ssh_logins[0].host,
                port: remote.ssh_logins[0].port,
                username: remote.ssh_logins[0].username,
                jumpProxy: remote.ssh_logins[0].jump_proxy
                  ? {
                      host: remote.ssh_logins[0].jump_proxy.host,
                      port: remote.ssh_logins[0].jump_proxy.port,
                      username: remote.ssh_logins[0].jump_proxy.username,
                    }
                  : null,
              }
            : null,
          createdAt: remote.created_at ?? null,
          expiresAt: remote.expires_at ?? null,
          terminatedAt: remote.terminated_at ?? null,
          failureReason: remote.failure_reason ?? null,
        },
      });
    }

    const states = remoteResources.map((r) => r.status);
    const upCount = states.filter((s) => s === 'up').length;
    const failed = remoteResources.filter((r) => r.failure_reason);

    log(`Tentativo ${attempt}: ${upCount}/${resources.length} attive [${states.join(', ')}]`);

    if (failed.length > 0) {
      throw new Error(
        `Provisioning fallito: ${failed.map((r) => r.failure_reason).join('; ')}`
      );
    }

    if (upCount === resources.length) {
      return { remoteResources, elapsedMs: Date.now() - startedAt };
    }

    await sleep(RESOURCE_POLL_MS);
  }

  throw new Error(
    `Timeout: le risorse non sono diventate attive entro ` +
    `${PROVISIONING_TIMEOUT_MS / 1000} secondi.`
  );
};

// ==========================================
// MATERIALIZZAZIONE DI UN ESPERIMENTO
// ==========================================

const deployExperiment = async (experiment) => {
  const { id, spec } = experiment;
  const timings = {};
  const totalStart = Date.now();

  // Controllo di idempotenza: se il documento ha gia' un identificatore
  // remoto e' gia' stato materializzato, e la richiesta va ignorata.
  if (experiment.remote.slicesExperimentId) {
    log(`"${spec.name}" risulta già materializzato, ignoro.`);
    return;
  }

  const resources = findDraftResources(id);
  log(`Materializzazione di "${spec.name}" con ${resources.length} risorse`);

  // Presa in carico. Le risorse passano direttamente a DEPLOYING senza
  // attraversare DEPLOY_REQUESTED: quello stato serve a distinguere una
  // richiesta in coda da una in lavorazione, ma per le risorse la richiesta
  // non arriva mai dall'interfaccia, le trascina l'esperimento.
  updateExperiment(id, { status: EXPERIMENT_STATUS.DEPLOYING });
  resources.forEach((r) => updateResource(r.id, { status: RESOURCE_STATUS.DEPLOYING }));

  try {
    // ---- 1. Esperimento ----
    const exp = await slicesService.createExperiment({
      name: spec.name,
      description: spec.description,
      duration: spec.duration,
    });

    timings.experiment = exp.elapsedMs;
    log(`Esperimento creato in ${exp.elapsedMs}ms → ${exp.slicesExperimentId}`);

    const createdAt = new Date();
    updateExperiment(id, {
      remote: {
        slicesExperimentId: exp.slicesExperimentId,
        projectName: process.env.SLICES_PROJECT || 'tesi-unibo',
        createdAt: createdAt.toISOString(),
        // Stima locale, corretta piu' avanti con il valore autorevole
        // restituito dalle risorse.
        expiresAt: new Date(createdAt.getTime() + durationToMs(spec.duration)).toISOString(),
        deleted: false,
      },
    });

    // ---- Caso senza risorse ----
    // Legittimo, non un errore: si ottiene un contenitore vuoto su SLICES.
    if (resources.length === 0) {
      updateExperiment(id, { status: EXPERIMENT_STATUS.DEPLOYED, error: null });
      timings.total = Date.now() - totalStart;
      log(`"${spec.name}" completato senza risorse (${timings.total}ms)`);
      return;
    }

    // ---- 2. Risorse ----
    const strategy = chooseStrategy(resources);

    const creation = strategy === 'batch'
      ? await createResourcesBatch(exp.slicesExperimentId, resources, spec.duration)
      : await createResourcesIndividually(exp.slicesExperimentId, resources, spec.duration);

    timings.resources = creation.elapsedMs;
    timings.invocations = creation.invocations;
    timings.strategy = strategy;

    // ---- 3. Attesa ----
    log('Attesa che le risorse diventino attive');
    const { remoteResources, elapsedMs } = await waitForResources(
      exp.slicesExperimentId, resources
    );
    timings.provisioning = elapsedMs;

    // ---- 4. Esito ----
    resources.forEach((r) => updateResource(r.id, { status: RESOURCE_STATUS.DEPLOYED }));

    // La scadenza autorevole e' quella riportata da SLICES sulle risorse, che
    // sostituisce la stima calcolata localmente al passo 1.
    const realExpiry = remoteResources[0]?.expires_at;
    const current = mockExperiments.find((e) => e.id === id);

    updateExperiment(id, {
      status: EXPERIMENT_STATUS.DEPLOYED,
      error: null,
      remote: {
        ...current.remote,
        expiresAt: realExpiry ?? current.remote.expiresAt,
      },
    });

    timings.total = Date.now() - totalStart;

    log(`"${spec.name}" completato: strategia ${timings.strategy}, ` +
        `${timings.invocations} invocazioni, ${timings.total}ms totali`);
    log(`Tempi (ms): experiment=${timings.experiment} resources=${timings.resources} ` +
        `provisioning=${timings.provisioning} total=${timings.total}`);

  } catch (error) {
    log(`"${spec.name}" fallito: ${error.message}`);

    updateExperiment(id, {
      status: EXPERIMENT_STATUS.FAILED,
      error: error.message,
    });

    // Le risorse rimaste in DEPLOYING non sono state create: quelle gia'
    // marcate FAILED o DEPLOYED conservano il proprio stato.
    //
    // NESSUN ROLLBACK: le risorse eventualmente gia' allocate restano su
    // SLICES. Distruggerle automaticamente sarebbe piu' rischioso che
    // lasciarle, perche' l'utente potrebbe volerle tenere, e la scadenza
    // automatica garantisce comunque che nulla resti indefinitamente.
    // Lo stato risultante e' onesto: mostra la situazione reale invece di
    // fingere coerenza.
    mockResources
      .filter((r) => r.experimentId === id && r.status === RESOURCE_STATUS.DEPLOYING)
      .forEach((r) => updateResource(r.id, {
        status: RESOURCE_STATUS.FAILED,
        remote: { ...r.remote, failureReason: error.message },
      }));
  }
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