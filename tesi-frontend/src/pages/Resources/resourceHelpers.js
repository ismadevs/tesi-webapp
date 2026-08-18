// ==========================================
// HELPER DELLE RISORSE
// ==========================================
// Funzioni di presentazione condivise da card, modali e form. Stanno in un
// punto solo perche' le stesse informazioni compaiono in piu' viste e devono
// essere formattate allo stesso modo ovunque.

// ==========================================
// STATI DI PROVISIONING RIPORTATI DA SLICES
// ==========================================
// Sequenza osservata sperimentalmente durante l'allocazione di una VM.
// Non e' documentata: renderla esplicita permette alla card di mostrare a che
// punto e' la macchina invece di un generico indicatore di attesa.
export const PROVISIONING_STEPS = [
  { key: 'imaging', label: 'Imaging', description: 'Copia dell\'immagine disco' },
  { key: 'booting', label: 'Booting', description: 'Avvio del sistema operativo' },
  { key: 'initializing', label: 'Initializing', description: 'Configurazione al primo avvio' },
  { key: 'up', label: 'Up', description: 'Macchina pronta' },
];

// Posizione dello stato corrente nella sequenza. Restituisce -1 per stati
// sconosciuti, cosi' l'interfaccia puo' degradare senza rompersi se SLICES
// introducesse un passaggio nuovo.
export const provisioningIndex = (slicesStatus) =>
  PROVISIONING_STEPS.findIndex((s) => s.key === slicesStatus);

export const isProvisioning = (slicesStatus) => {
  const index = provisioningIndex(slicesStatus);
  return index >= 0 && index < PROVISIONING_STEPS.length - 1;
};

// ==========================================
// TIPI DI RISORSA
// ==========================================
// SLICES non ha un parametro per il tipo: lo deriva dal sito. L'interfaccia
// fa il percorso inverso, presentando il concetto che l'utente ha in mente.
export const KIND_LABELS = {
  vm: 'Virtual machine',
  baremetal: 'Bare metal',
};

export const kindLabel = (kind) => KIND_LABELS[kind] ?? kind;

// ==========================================
// FORMATTAZIONE DEL FLAVOR
// ==========================================
// Il nome di un flavor da solo non dice nulla: "tiny" e "pcgen07" non
// comunicano quanta memoria o quanti processori si otterranno. Le
// caratteristiche vanno sempre mostrate accanto.
//
// I due tipi hanno attributi diversi e non sovrapponibili. Sulle VM il campo
// CPU e' un numero di vCPU astratte; sul baremetal e' una topologia fisica
// nella forma socket x core x thread, informazione che su una macchina
// virtuale non avrebbe senso.
export const formatFlavor = (flavorDetails) => {
  if (!flavorDetails) return null;

  const parts = [];

  if (flavorDetails.vcpus !== undefined) {
    parts.push(`${flavorDetails.vcpus} vCPU`);
  } else if (flavorDetails.cpuTopology) {
    parts.push(flavorDetails.cpuTopology);
  }

  if (flavorDetails.ramGib) parts.push(`${flavorDetails.ramGib} GiB RAM`);
  if (flavorDetails.rootDiskGb) parts.push(`${flavorDetails.rootDiskGb} GB disk`);
  if (flavorDetails.gpu) parts.push(flavorDetails.gpu);

  return parts.join(' · ');
};

// Etichetta completa per i menu a tendina del form.
export const flavorOptionLabel = (flavor) => {
  const details = formatFlavor(flavor);
  return details ? `${flavor.name} — ${details}` : flavor.name;
};

// ==========================================
// COMANDO SSH
// ==========================================
// Le macchine senza indirizzo pubblico restano raggiungibili attraverso un
// bastion host fornito dall'infrastruttura. Il flag -J di OpenSSH indica il
// salto intermedio: la connessione passa dal bastion e prosegue verso la
// macchina sulla rete interna.
//
// Comporre il comando qui e offrirlo da copiare evita all'utente di doverlo
// ricostruire a mano.
export const buildSshCommand = (sshLogin) => {
  if (!sshLogin?.host) return null;

  const target = `${sshLogin.username}@${sshLogin.host}`;

  if (sshLogin.jumpProxy?.host) {
    const jump = `${sshLogin.jumpProxy.username}@${sshLogin.jumpProxy.host}`;
    return `ssh -J ${jump} ${target}`;
  }

  return `ssh ${target}`;
};