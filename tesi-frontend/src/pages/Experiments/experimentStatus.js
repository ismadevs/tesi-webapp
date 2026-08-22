// ==========================================
// CONFIGURAZIONE DEGLI STATI E HELPER TEMPORALI
// ==========================================
// Tabella e dettaglio devono rappresentare gli stessi stati con gli stessi
// colori e le stesse etichette. Definirli in un punto solo evita che le due
// viste divergano nel tempo, ed e' anche il posto naturale in cui aggiungere
// uno stato quando la piattaforma si estendera'.

// Gli stati rispecchiano quelli del backend. I primi due appartengono alla
// piattaforma, gli altri riflettono l'esito dell'interazione con SLICES-RI.
export const STATUS = {
  DRAFT: 'DRAFT',
  DEPLOY_REQUESTED: 'DEPLOY_REQUESTED',
  DEPLOYING: 'DEPLOYING',
  DEPLOYED: 'DEPLOYED',
  FAILED: 'FAILED',
  DESTROY_REQUESTED: 'DESTROY_REQUESTED',
  DESTROYING: 'DESTROYING',
  DESTROYED: 'DESTROYED',
};

// Per ogni stato: etichetta leggibile, classi cromatiche e se il pallino
// debba pulsare. Il pulsare segnala che qualcosa e' in movimento, quindi
// vale per gli stati transitori e per quello attivo.
const STATUS_CONFIG = {
  [STATUS.DRAFT]: {
    label: "Draft",
    text: "text-gray-600",
    bg: "bg-gray-50",
    border: "border-gray-200",
    dot: "bg-gray-400",
    pulse: false,
  },
  [STATUS.DEPLOY_REQUESTED]: {
    label: "Queued",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-500",
    pulse: true,
  },
  [STATUS.DEPLOYING]: {
    label: "Deploying",
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-500",
    pulse: true,
  },
  [STATUS.DEPLOYED]: {
    label: "Deployed",
    text: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    dot: "bg-emerald-500",
    pulse: true,
  },
  [STATUS.FAILED]: {
    label: "Failed",
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-100",
    dot: "bg-rose-500",
    pulse: false,
  },
  [STATUS.DESTROY_REQUESTED]: {
    label: "Destroying",
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    dot: "bg-orange-500",
    pulse: true,
  },
  [STATUS.DESTROYING]: {
    label: "Destroying",
    text: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    dot: "bg-orange-500",
    pulse: true,
  },
  [STATUS.DESTROYED]: {
    label: "Destroyed",
    text: "text-gray-500",
    bg: "bg-gray-50",
    border: "border-gray-200",
    dot: "bg-gray-300",
    pulse: false,
  },
};

export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || STATUS_CONFIG[STATUS.DRAFT];

// Solo le bozze sono modificabili: il passaggio a materializzato e' a senso
// unico, perche' cambiare una specifica gia' applicata non avrebbe alcun
// effetto sulle risorse gia' allocate su SLICES.
export const isEditable = (experiment) => experiment?.status === STATUS.DRAFT;

// ==========================================
// HELPER TEMPORALI
// ==========================================

// Su SLICES ogni risorsa ha vita limitata e il default e' di poche ore.
// Il tempo rimanente e' quindi piu' utile della data assoluta: "1h 23m"
// si legge a colpo d'occhio, "2026-08-02T18:51:00Z" richiede un calcolo.
export const formatTimeLeft = (expiresAt) => {
  if (!expiresAt) return null;

  const remainingMs = new Date(expiresAt) - Date.now();
  if (remainingMs <= 0) return 'Expired';

  const totalMinutes = Math.floor(remainingMs / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

// Vero quando manca meno di un'ora: l'interfaccia lo evidenzia in rosso
// perche' oltre la scadenza le risorse vengono perse in modo irrecuperabile.
export const isExpiringSoon = (expiresAt) => {
  if (!expiresAt) return false;
  const remainingMs = new Date(expiresAt) - Date.now();
  return remainingMs > 0 && remainingMs < 3600000;
};

export const formatDateTime = (isoString) => {
  if (!isoString) return null;
  return new Date(isoString).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Un esperimento è distruggibile quando esiste su SLICES e non è già stato
// liberato. Il documento resta comunque nella piattaforma: l'eliminazione è
// un'azione separata e successiva.
export const isDestroyable = (experiment) =>
  Boolean(experiment?.remote?.slicesExperimentId) &&
  !experiment.isExpired &&
  [STATUS.DEPLOYED, STATUS.FAILED].includes(experiment.status);

// Il documento è rimovibile quando nulla è allocato: una bozza, un
// esperimento distrutto, oppure uno scaduto, le cui macchine sono state
// liberate automaticamente dall'infrastruttura.
export const isRemovable = (experiment) =>
  [STATUS.DRAFT, STATUS.DESTROYED].includes(experiment?.status) ||
  Boolean(experiment?.isExpired);