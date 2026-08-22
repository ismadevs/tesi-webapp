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
//   - la risposta HTTP è immediata anche se il provisioning dura minuti
//   - l'intenzione è persistente: sopravvive alla chiusura del browser e al
//     riavvio del backend, perché è un documento e non una chiamata
//   - lo stato dell'operazione è osservabile da chiunque, non solo da chi ha
//     premuto il pulsante
//
// SULLA PERSISTENZA
// Con CouchDB ogni aggiornamento richiede la revisione corrente del
// documento. L'orchestratore scrive più volte sullo stesso documento durante
// un deploy, quindi ogni funzione di scrittura rilegge prima di scrivere:
// tenere in memoria una revisione vecchia produrrebbe conflitti.
//
// Il polling a intervallo resta perché SLICES non offre notifiche. Quello
// verso il database potrà invece essere sostituito dal changes feed.

import * as db from './couchdb.js';
import Experiment, { EXPERIMENT_STATUS } from '../models/Experiment.js';
import Resource, { RESOURCE_STATUS } from '../models/Resource.js';
import * as slicesService from './slicesService.js';

// Ogni quanto cercare richieste da elaborare.
const POLL_INTERVAL_MS = 2000;

// Ogni quanto interrogare lo stato delle risorse durante il provisioning.
// Cinque secondi e non meno: ogni invocazione della CLI costa centinaia di
// millisecondi per l'avvio dell'interprete Python, e l'allocazione richiede
// comunque decine di secondi.
const RESOURCE_POLL_MS = 5000;

// Oltre questa soglia si rinuncia ad attendere.
const PROVISIONING_TIMEOUT_MS = 600000;

let isProcessing = false;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (msg) => console.log(`[orchestrator] ${msg}`);

// ==========================================
// ACCESSO AI DOCUMENTI
// ==========================================

const findPendingExperiments = () =>
  db.queryDocs('experiments', 'by_status', { key: EXPERIMENT_STATUS.DEPLOY_REQUESTED });

const findResourcesToDestroy = () =>
  db.queryDocs('resources', 'by_status', { key: RESOURCE_STATUS.DESTROY_REQUESTED });

const findDraftResources = (experimentId) =>
  db.queryDocs('resources', 'by_experiment', {
    key: [experimentId, RESOURCE_STATUS.DRAFT],
});

const findExperimentsToDestroy = () =>
  db.queryDocs('experiments', 'by_status', { key: EXPERIMENT_STATUS.DESTROY_REQUESTED });

// Rilegge il documento prima di scrivere, così la revisione è sempre quella
// corrente. Costa una richiesta in più, ma elimina alla radice i conflitti
// dovuti a una revisione tenuta in memoria fra un aggiornamento e l'altro.
const patchExperiment = async (id, changes) => {
  const current = await db.getDoc(id);
  if (!current) return null;

  const updated = new Experiment({
    ...current,
    ...changes,
    updatedAt: new Date().toISOString(),
  });

  return db.putDoc({ ...updated });
};

const patchResource = async (id, changes) => {
  const current = await db.getDoc(id);
  if (!current) return null;

  const updated = new Resource({
    ...current,
    ...changes,
    updatedAt: new Date().toISOString(),
  });

  return db.putDoc({ ...updated });
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
// Due interfacce della stessa API con capacità diverse:
//   - `create-from-file` crea tutte le risorse in una invocazione, ma la
//     specifica JSON rifiuta il campo public_ipv4
//   - `bi create` accetta --public-ipv4, ma va invocato una volta per risorsa
//
// La piattaforma compensa la discrepanza invece di ereditarne il limite:
// sceglie il comando adatto in base a ciò che l'esperimento contiene.
//
// La regola è tutto o niente per esperimento. Un approccio ibrido sarebbe più
// efficiente, ma introdurrebbe due superfici di errore nello stesso deploy e
// renderebbe non confrontabili le misure di tempo.
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

  // Sequenziale e non parallelo: su hardware condiviso è preferibile non
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
      // La risorsa che ha fallito viene marcata individualmente, così
      // l'interfaccia mostra quale delle N non è stata creata.
      await patchResource(resource._id, {
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
// L'allocazione è asincrona: il comando di creazione ritorna in pochi
// secondi, ma le macchine attraversano una sequenza di stati prima di essere
// utilizzabili (imaging, booting, initializing, up).
//
// Durante l'attesa gli stati intermedi vengono scritti nei documenti: è ciò
// che alimenta la progressione a quattro tappe mostrata sulle card. Senza
// queste scritture l'interfaccia resterebbe ferma per tutta la durata.
const waitForResources = async (slicesExperimentId, resources) => {
  const startedAt = Date.now();
  let attempt = 0;

  while (Date.now() - startedAt < PROVISIONING_TIMEOUT_MS) {
    attempt++;

    const remoteResources = await slicesService.listResources(slicesExperimentId);

    // Le risorse si riconciliano per friendly_name: la creazione a blocco non
    // restituisce identificatori associabili, quindi il nome dichiarato è
    // l'unico aggancio disponibile fra documento e risorsa remota.
    for (const resource of resources) {
      const remote = remoteResources.find((r) => r.friendly_name === resource.spec.name);
      if (!remote) continue;

      await patchResource(resource._id, {
        remote: {
          resourceId: remote.id,
          // Lo stato reale è minuscolo: la tabella della CLI lo mostra
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
  const { _id: id, spec } = experiment;
  const timings = {};
  const totalStart = Date.now();

  // Controllo di idempotenza: se il documento ha già un identificatore
  // remoto è già stato materializzato, e la richiesta va ignorata.
  if (experiment.remote.slicesExperimentId) {
    log(`"${spec.name}" risulta già materializzato, ignoro.`);
    return;
  }

  const resources = await findDraftResources(id);
  log(`Materializzazione di "${spec.name}" con ${resources.length} risorse`);

  // Presa in carico. Le risorse passano direttamente a DEPLOYING senza
  // attraversare DEPLOY_REQUESTED: quello stato serve a distinguere una
  // richiesta in coda da una in lavorazione, ma per le risorse la richiesta
  // non arriva mai dall'interfaccia, le trascina l'esperimento.
  await patchExperiment(id, { status: EXPERIMENT_STATUS.DEPLOYING });
  for (const resource of resources) {
    await patchResource(resource._id, { status: RESOURCE_STATUS.DEPLOYING });
  }

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
    await patchExperiment(id, {
      remote: {
        slicesExperimentId: exp.slicesExperimentId,
        projectName: process.env.SLICES_PROJECT || 'tesi-unibo',
        createdAt: createdAt.toISOString(),
        // Stima locale, corretta più avanti con il valore autorevole
        // restituito dalle risorse.
        expiresAt: new Date(createdAt.getTime() + durationToMs(spec.duration)).toISOString(),
        deleted: false,
      },
    });

    // ---- Caso senza risorse ----
    // Legittimo, non un errore: si ottiene un contenitore vuoto su SLICES.
    if (resources.length === 0) {
      await patchExperiment(id, { status: EXPERIMENT_STATUS.DEPLOYED, error: null });
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
    for (const resource of resources) {
      await patchResource(resource._id, { status: RESOURCE_STATUS.DEPLOYED });
    }

    // La scadenza autorevole è quella riportata da SLICES sulle risorse, che
    // sostituisce la stima calcolata localmente al passo 1.
    const realExpiry = remoteResources[0]?.expires_at;
    const current = await db.getDoc(id);

    await patchExperiment(id, {
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

    await patchExperiment(id, {
      status: EXPERIMENT_STATUS.FAILED,
      error: error.message,
    });

    // Le risorse rimaste in DEPLOYING non sono state create: quelle già
    // marcate FAILED o DEPLOYED conservano il proprio stato.
    //
    // NESSUN ROLLBACK: le risorse eventualmente già allocate restano su
    // SLICES. Distruggerle automaticamente sarebbe più rischioso che
    // lasciarle, perché l'utente potrebbe volerle tenere, e la scadenza
    // automatica garantisce comunque che nulla resti indefinitamente.
    // Lo stato risultante è onesto: mostra la situazione reale invece di
    // fingere coerenza.
    const stillDeploying = await db.queryDocs('resources', 'by_experiment', {
      key: [id, RESOURCE_STATUS.DEPLOYING],
    });

    for (const resource of stillDeploying) {
      await patchResource(resource._id, {
        status: RESOURCE_STATUS.FAILED,
        remote: { ...resource.remote, failureReason: error.message },
      });
    }
  }
};

// ==========================================
// DISTRUZIONE DI UN ESPERIMENTO
// ==========================================
// `slices experiment delete --force` libera l'esperimento e tutte le risorse
// che contiene: una sola invocazione al posto di una per macchina.
//
// Il flag --force è obbligatorio da programma: senza, la CLI chiede una
// conferma interattiva e il processo figlio resta appeso in attesa di un
// input che non arriverà mai, senza errore né timeout.
const destroyExperiment = async (experiment) => {
  const { _id: id, spec, remote } = experiment;

  if (!remote.slicesExperimentId) {
    await patchExperiment(id, {
      status: EXPERIMENT_STATUS.FAILED,
      error: 'Identificatore remoto mancante.',
    });
    return;
  }

  log(`Distruzione dell'esperimento "${spec.name}"`);
  await patchExperiment(id, { status: EXPERIMENT_STATUS.DESTROYING });

  try {
    await slicesService.deleteExperiment(remote.slicesExperimentId);

    const terminatedAt = new Date().toISOString();

    // Tutte le risorse ancora vive vanno marcate come distrutte: su SLICES
    // sono già sparite insieme all'esperimento, e lasciarle DEPLOYED
    // significherebbe mostrare uno stato che non corrisponde più alla realtà.
    const resources = await db.queryDocs('resources', 'by_experiment', {
      startkey: [id],
      endkey: [id, {}],
    });

    for (const resource of resources) {
      if (resource.status === RESOURCE_STATUS.DESTROYED) continue;
      if (resource.status === RESOURCE_STATUS.DRAFT) continue;

      await patchResource(resource._id, {
        status: RESOURCE_STATUS.DESTROYED,
        remote: { ...resource.remote, slicesStatus: null, terminatedAt },
      });
    }

    // Il documento resta, con lo stato aggiornato e il flag deleted che
    // rispecchia il soft delete di SLICES.
    const current = await db.getDoc(id);
    await patchExperiment(id, {
      status: EXPERIMENT_STATUS.DESTROYED,
      error: null,
      remote: { ...current.remote, deleted: true },
    });

    log(`"${spec.name}" distrutto insieme a ${resources.length} risorse`);
  } catch (error) {
    log(`Distruzione di "${spec.name}" fallita: ${error.message}`);

    // Si torna a DEPLOYED e non a FAILED: l'esperimento è ancora attivo su
    // SLICES, quindi lo stato deve dire la verità e l'utente può riprovare.
    await patchExperiment(id, {
      status: EXPERIMENT_STATUS.DEPLOYED,
      error: error.message,
    });
  }
};

// ==========================================
// DISTRUZIONE DELLE RISORSE
// ==========================================

const destroyResource = async (resource) => {
  const experiment = await db.getDoc(resource.experimentId);
  const slicesExperimentId = experiment?.remote?.slicesExperimentId;

  if (!slicesExperimentId) {
    await patchResource(resource._id, {
      status: RESOURCE_STATUS.FAILED,
      remote: { ...resource.remote, failureReason: 'Esperimento remoto non trovato.' },
    });
    return;
  }

  log(`Distruzione di "${resource.spec.name}"`);
  await patchResource(resource._id, { status: RESOURCE_STATUS.DESTROYING });

  try {
    await slicesService.destroyResources(slicesExperimentId, [resource.spec.name]);

    // Il documento resta: cambia stato e registra quando la macchina è stata
    // liberata. expiresAt conserva la scadenza che avrebbe avuto, così la
    // differenza fra i due campi racconta se è stata distrutta prima del tempo.
    await patchResource(resource._id, {
      status: RESOURCE_STATUS.DESTROYED,
      remote: {
        ...resource.remote,
        slicesStatus: null,
        terminatedAt: new Date().toISOString(),
      },
    });

    log(`"${resource.spec.name}" distrutta`);
  } catch (error) {
    log(`Distruzione di "${resource.spec.name}" fallita: ${error.message}`);

    // Si torna a DEPLOYED e non a FAILED: la macchina è ancora allocata,
    // quindi lo stato deve dire la verità e l'utente può riprovare.
    await patchResource(resource._id, {
      status: RESOURCE_STATUS.DEPLOYED,
      remote: { ...resource.remote, failureReason: error.message },
    });
  }
};

// ==========================================
// CICLO DI OSSERVAZIONE
// ==========================================

const processPending = async () => {
  if (isProcessing) return;

  const [pending, toDestroy, experimentsToDestroy] = await Promise.all([
    findPendingExperiments(),
    findResourcesToDestroy(),
    findExperimentsToDestroy(),
  ]);

  if (pending.length === 0 && toDestroy.length === 0 && experimentsToDestroy.length === 0) {
    return;
  }

  isProcessing = true;
  try {
    for (const experiment of pending) {
      await deployExperiment(experiment);
    }

    for (const resource of toDestroy) {
      await destroyResource(resource);
    }

    // Per ultima: distruggere un esperimento porta via anche le risorse,
    // quindi eventuali distruzioni singole in coda vanno elaborate prima.
    for (const experiment of experimentsToDestroy) {
      await destroyExperiment(experiment);
    }
  } finally {
    isProcessing = false;
  }
};

export const startOrchestrator = () => {
  console.log(`🔄 Orchestratore avviato (intervallo ${POLL_INTERVAL_MS}ms)`);
  setInterval(() => {
    processPending().catch((err) =>
      console.error('[orchestrator] Errore non gestito nel ciclo:', err.message)
    );
  }, POLL_INTERVAL_MS);
};