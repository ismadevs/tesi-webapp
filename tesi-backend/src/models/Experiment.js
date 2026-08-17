// ==========================================
// LAYER DEI DATI (MODEL) - EXPERIMENTS
// ==========================================
// Un Esperimento è il contenitore logico previsto da SLICES-RI: raggruppa le
// risorse (VM, baremetal, cluster) e ne delimita il ciclo di vita.
//
// PRINCIPIO DI PROGETTAZIONE
// Il documento è diviso in due domini distinti:
//   - spec   -> cio che l'utente DICHIARA. Corrisponde ai parametri accettati da
//               `slices experiment create`. Modificabile finche' lo stato e' DRAFT.
//   - remote -> cio che SLICES RESTITUISCE dopo la materializzazione. Il sistema
//               lo riceve, non lo decide. Nullo finche' non avviene il deploy.
//
// Tenerli separati evita ambiguita' tra intenzione e realta', e in prospettiva
// CouchDB riduce i conflitti di scrittura: il frontend tocca solo `spec`,
// il controller di orchestrazione solo `status` e `remote`.

// ==========================================
// STATI DEL DOCUMENTO
// ==========================================
// I primi due appartengono alla piattaforma, gli altri riflettono l'esito
// dell'interazione con SLICES.
export const EXPERIMENT_STATUS = {
  DRAFT: 'DRAFT',                       // esiste solo nella piattaforma
  DEPLOY_REQUESTED: 'DEPLOY_REQUESTED', // l'utente ha premuto Deploy
  DEPLOYING: 'DEPLOYING',               // il controller ha invocato la CLI
  DEPLOYED: 'DEPLOYED',                 // materializzato su SLICES
  FAILED: 'FAILED',                     // errore, motivo in `error`
};

// Elenco degli stati validi, usato in validazione.
export const EXPERIMENT_STATUSES = Object.values(EXPERIMENT_STATUS);

// Solo in DRAFT la specifica e' modificabile ed eliminabile: il passaggio a
// materializzato e' a senso unico, perche' modificare una specifica gia'
// applicata non avrebbe alcun effetto sulle risorse gia' allocate.
export const isEditable = (experiment) =>
  experiment.status === EXPERIMENT_STATUS.DRAFT;

export default class Experiment {
  constructor(data = {}) {
    // ==========================================
    // 1. IDENTIFICATORE LOCALE
    // ==========================================
    // Identificatore generato dalla piattaforma, immutabile. E' distinto
    // dall'identificatore SLICES (in remote.slicesExperimentId) perche' il
    // documento esiste PRIMA che l'infrastruttura ne assegni uno.
    // Le relazioni interne (risorse -> esperimento) usano sempre questo,
    // cosi' restano valide sia prima sia dopo il deploy.
    this.id = data.id || null;

    // ==========================================
    // 2. SPECIFICA (dichiarata dall'utente)
    // ==========================================
    // Corrisponde esattamente ai tre parametri di `slices experiment create`:
    // il nome (argomento obbligatorio), --description e --duration.
    const spec = data.spec || {};
    this.spec = {
      name: (spec.name ?? '').trim(),
      description: (spec.description ?? '').trim(),
      // La durata appartiene all'esperimento e non alla singola risorsa:
      // `slices bi create-from-file` accetta un solo valore --duration per
      // invocazione, quindi vale per l'intero pacchetto materializzato.
      duration: (spec.duration ?? '2h').trim(),
    };

    // ==========================================
    // 3. STATO
    // ==========================================
    this.status = EXPERIMENT_STATUSES.includes(data.status)
      ? data.status
      : EXPERIMENT_STATUS.DRAFT;

    // ==========================================
    // 4. DATI RESTITUITI DA SLICES
    // ==========================================
    // Tutti nulli finche' il deploy non avviene. Sono l'unica prova che
    // l'esperimento esiste davvero sull'infrastruttura.
    const remote = data.remote || {};
    this.remote = {
      // Identificatore reale, formato exp_expauth.ilabt.imec.be_01kz...
      slicesExperimentId: remote.slicesExperimentId ?? null,
      // Nome del progetto SLICES in cui e' stato creato.
      projectName: remote.projectName ?? null,
      // Istante di creazione lato infrastruttura.
      createdAt: remote.createdAt ?? null,
      // Scadenza effettiva, calcolata da SLICES a partire dalla durata.
      expiresAt: remote.expiresAt ?? null,
      // SLICES non elimina i record, li marca come cancellati (soft delete).
      deleted: remote.deleted ?? false,
    };

    // ==========================================
    // 5. ERRORE
    // ==========================================
    // Valorizzato solo in stato FAILED. Contiene il motivo riportato dalla CLI.
    this.error = data.error ?? null;

    // ==========================================
    // 6. TIMESTAMP LOCALI
    // ==========================================
    // Attenzione a non confonderli con remote.createdAt: questi si riferiscono
    // al documento nella piattaforma, quelli alla risorsa su SLICES.
    // Servono per ordinare la tabella e sapere da quanto una bozza e' ferma.
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || this.createdAt;
  }

  // Comodita' per il livello di presentazione: indica se l'esperimento
  // e' stato materializzato, leggendo un solo campo senza interrogare SLICES.
  get isDeployed() {
    return this.remote.slicesExperimentId !== null;
  }
}