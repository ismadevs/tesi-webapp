// ==========================================
// LAYER DEI DATI (MODEL)
// ==========================================
// Questo file rappresenta lo "stampino" della nostra entità principale.
// Ora supporta un'architettura polimorfica (Spec Pattern) per gestire in modo
// sicuro sia le Macchine Virtuali (Slices VM) che i Cluster Kubernetes.

export default class ResourceSite{
  // Passiamo un unico oggetto `data` generico, in modo che il costruttore
  // possa "pescare" dinamicamente i campi giusti in base al tipo di risorsa.
  constructor(data) {

    // 1. IDENTIFICAZIONE BASE (Dati Comuni)
    // L'ID numerico generato dal Service o recuperato dal database.
    this.id = data.id;

    // Il nome inserito dal ricercatore.
    this.name = data.name;

    // Questa è la chiave di volta dell'intera architettura.
    // 'slices-vm' oppure 'kubernetes-cluster'. Obbligatorio.
    this.resourceType = data.resourceType;

    // 2. VALIDAZIONE DELLO STATO (ENUM SIMULATO)
    // Abbiamo aggiunto 'in-use' per le macchine attualmente allocate a un ricercatore.
    // Se la risorsa è appena nata, forziamo lo stato 'creating'.
    const validStatuses = ['online', 'offline', 'maintenance', 'in-use'];
    this.status = validStatuses.includes(data.status) ? data.status : 'creating';

    // Data di creazione automatica se non fornita (in formato ISO standard)
    this.createdAt = data.createdAt || new Date().toISOString();

    // 3. DATI POST-CREAZIONE (Connessione)
    // Questi dati non vengono MAI chiesti nel form di creazione.
    // Il backend li genera e li salva qui solo quando i server fisici sono pronti.
    this.connection = data.connection || {
      ipAddress: data.ipAddress || null,
      accessKey: data.accessKey || null // SSH key per le VM, kubeconfig per i cluster
    };

    // 4. STRUTTURAZIONE DINAMICA: SPECIFICATIONS
    // Questo oggetto cambia forma a seconda del 'resourceType'.
    // È strutturato per leggere i dati sia se arrivano dal frontend (piatti),
    // sia se arrivano dal database (già dentro l'oggetto spec).
    this.spec = {};

    if (this.resourceType === 'slices-vm') {
      // Modello per una singola Macchina Virtuale
      this.spec = {
        os: data.os || (data.spec && data.spec.os) || 'Unknown OS',
        cpuCores: Number(data.cpuCores || (data.spec && data.spec.cpuCores) || 0),
        ramGB: Number(data.ramGB || (data.spec && data.spec.ramGB) || 0),
        storageTB: Number(data.storageTB || (data.spec && data.spec.storageTB) || 0)
      };
    }
    else if (this.resourceType === 'kubernetes-cluster') {
      // Modello per un'intera infrastruttura orchestrata
      this.spec = {
        k8sVersion: data.k8sVersion || (data.spec && data.spec.k8sVersion) || 'v1.28.0',
        workerNodes: Number(data.workerNodes || (data.spec && data.spec.workerNodes) || 0),
        nodeFlavor: data.nodeFlavor || (data.spec && data.spec.nodeFlavor) || 'Unknown Flavor'
      };
    }
  }
}