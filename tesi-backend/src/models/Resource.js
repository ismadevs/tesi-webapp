// ==========================================
// LAYER DEI DATI (MODEL) - RESOURCES
// ==========================================
// Una Risorsa e' la macchina vera: una VM o un server baremetal allocato su
// un sito di SLICES-RI.
//
// RELAZIONE CON L'ESPERIMENTO
// La risorsa NON ha esistenza autonoma. Nasce dentro un esperimento e muore
// con lui: non e' un oggetto riutilizzabile che si aggancia e si sgancia.
// Il vincolo non e' una semplificazione del prototipo ma la semantica della
// piattaforma, verificabile dal fatto che `slices bi list` richiede
// obbligatoriamente --experiment e non esiste modo di elencare le proprie
// risorse globalmente.
//
// Per questo il riferimento va in questa direzione: la risorsa punta al suo
// esperimento, e non l'esperimento a un elenco di risorse.

import { kindForInfra } from './catalog.js';

// ==========================================
// STATI
// ==========================================
// I primi due appartengono alla piattaforma, gli altri riflettono l'esito
// dell'interazione con SLICES. Sono gli stessi dell'esperimento perche' la
// risorsa segue il ciclo di vita del suo contenitore: viene materializzata
// insieme a lui e con lui fallisce.
export const RESOURCE_STATUS = {
  DRAFT: 'DRAFT',
  DEPLOY_REQUESTED: 'DEPLOY_REQUESTED',
  DEPLOYING: 'DEPLOYING',
  DEPLOYED: 'DEPLOYED',
  FAILED: 'FAILED',

  // Ciclo di distruzione. Segue lo stesso schema del deploy: l'interfaccia
  // scrive la richiesta, l'orchestratore la esegue.
  DESTROY_REQUESTED: 'DESTROY_REQUESTED',
  DESTROYING: 'DESTROYING',

  // La macchina è stata liberata su SLICES per volontà dell'utente.
  // Il documento NON viene cancellato: la specifica sopravvive alla risorsa,
  // che è il principio su cui poggia l'intera piattaforma. Cancellarlo
  // riprodurrebbe il problema che il sistema vuole risolvere.
  DESTROYED: 'DESTROYED',
};

// Stati in cui la risorsa esiste ancora sull'infrastruttura e occupa hardware.
export const LIVE_STATUSES = [
  RESOURCE_STATUS.DEPLOY_REQUESTED,
  RESOURCE_STATUS.DEPLOYING,
  RESOURCE_STATUS.DEPLOYED,
  RESOURCE_STATUS.DESTROY_REQUESTED,
  RESOURCE_STATUS.DESTROYING,
];

export const RESOURCE_STATUSES = Object.values(RESOURCE_STATUS);

// ==========================================
// STATI RIPORTATI DA SLICES
// ==========================================
// Sequenza osservata sperimentalmente durante il provisioning:
//   imaging      copia dell'immagine disco sul volume
//   booting      avvio del sistema operativo
//   initializing configurazione al primo avvio, inclusa l'iniezione della
//                chiave SSH
//   up           macchina pronta e raggiungibile
//
// Non e' documentata da nessuna parte. Averla esplicita permette
// all'interfaccia di mostrare a che punto e' l'allocazione invece di un
// generico indicatore di attesa: e' informazione che la CLI fornisce solo a
// chi sa interpretarla.
//
// Attenzione: i valori sono in MINUSCOLO. La tabella della CLI li mostra
// capitalizzati, ma l'output JSON riporta la forma reale.
export const SLICES_PROVISIONING_STEPS = ['imaging', 'booting', 'initializing', 'up'];

// Solo in DRAFT la specifica e' modificabile. Vale anche per la risorsa:
// una volta allocata la macchina, cambiare la specifica non avrebbe alcun
// effetto sull'hardware gia' assegnato.
export const isEditable = (resource) => resource.status === RESOURCE_STATUS.DRAFT;

export default class Resource {
  constructor(data = {}) {
    // ==========================================
    // 1. IDENTIFICATORI
    // ==========================================
    this.id = data.id || null;

    // Riferimento all'identificatore LOCALE dell'esperimento, non a quello
    // di SLICES. La relazione deve valere anche prima del deploy, quando
    // l'identificatore remoto non esiste ancora.
    this.experimentId = data.experimentId || null;

    // ==========================================
    // 2. SPECIFICA (dichiarata dall'utente)
    // ==========================================
    const spec = data.spec || {};
    const infra = spec.infra ?? null;

    this.spec = {
      name: (spec.name ?? '').trim(),

      // Sito su cui allocare. In SLICES non e' un parametro di `bi create` ma
      // il contesto del gruppo `slices bi`, indicato con --infra.
      infra,

      // Tipo di risorsa. SLICES non lo accetta come parametro: lo DERIVA dal
      // sito. Qui viene reso esplicito perche' rende il documento leggibile
      // senza consultare il catalogo, e perche' e' il concetto che l'utente
      // ha in mente quando compila il form.
      kind: spec.kind ?? kindForInfra(infra),

      flavor: spec.flavor ?? null,
      image: spec.image ?? null,

      // Richiesta di indirizzo IP pubblico.
      //
      // VINCOLO SCOPERTO SPERIMENTALMENTE: la specifica JSON di
      // `create-from-file` RIFIUTA questo campo con l'errore
      // "Object contains unknown field `public_ipv4`", mentre
      // `slices bi create` lo accetta come --public-ipv4.
      //
      // Due interfacce della stessa API con capacita' diverse. La
      // piattaforma compensa la discrepanza: l'orchestratore sceglie il
      // comando in base a cio' che l'esperimento contiene, invece di
      // ereditarne il limite.
      publicIpv4: spec.publicIpv4 ?? false,
    };

    // ==========================================
    // 3. STATO
    // ==========================================
    this.status = RESOURCE_STATUSES.includes(data.status)
      ? data.status
      : RESOURCE_STATUS.DRAFT;

    // ==========================================
    // 4. DATI RESTITUITI DA SLICES
    // ==========================================
    const remote = data.remote || {};
    this.remote = {
      // Identificatore reale, formato r_be-gent1-bi-vm1_01kz...
      resourceId: remote.resourceId ?? null,

      // Stato riportato dalla piattaforma, minuscolo.
      slicesStatus: remote.slicesStatus ?? null,

      // Indirizzo pubblico, presente solo se richiesto e concesso.
      publicIpv4: remote.publicIpv4 ?? null,

      // Indirizzo sulla rete interna del sito. Le macchine ne hanno comunque
      // uno anche senza IP pubblico, ed e' quello usato per l'accesso SSH.
      privateIpv4: remote.privateIpv4 ?? null,

      // Console della macchina via browser, fornita da SLICES. E' una
      // funzionalita' che la CLI non offre e che l'interfaccia web puo'
      // esporre senza alcuna implementazione.
      consoleUrl: remote.consoleUrl ?? null,

      // Dati di accesso: host, porta, utente, ed eventuale jump proxy.
      // Le macchine senza indirizzo pubblico restano raggiungibili
      // attraverso un bastion host fornito dall'infrastruttura.
      sshLogin: remote.sshLogin ?? null,

      createdAt: remote.createdAt ?? null,
      expiresAt: remote.expiresAt ?? null,
      terminatedAt: remote.terminatedAt ?? null,

      // Scadenza prevista e termine effettivo sono campi distinti: una
      // risorsa distrutta prima della scadenza avra' valori diversi.
      failureReason: remote.failureReason ?? null,
    };

    this.error = data.error ?? null;

    // Timestamp locali, riferiti al documento nella piattaforma e non alla
    // risorsa su SLICES.
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || this.createdAt;
  }

  get isDeployed() {
    return this.remote.resourceId !== null;
  }
}