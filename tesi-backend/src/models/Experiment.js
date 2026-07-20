// ==========================================
// LAYER DEI DATI (MODEL) - EXPERIMENTS
// ==========================================
// Questo file rappresenta lo "stampino" (Model) per l'entità Esperimento.
// Un Esperimento non è una macchina fisica, ma un "Workspace" o progetto logico
// che raggruppa e alloca risorse esistenti (VM intere o partizioni di Cluster K8s)
// per creare scenari di esecuzione scientifica riproducibili.

export default class Experiment {
  // Passiamo un unico oggetto `data` al costruttore per mappare
  // i campi in arrivo dal form frontend o dal database (mock).
  constructor(data) {

    // 1. IDENTIFICAZIONE BASE
    // L'ID numerico univoco generato dal backend (Service).
    this.id = data.id;

    // Il nome dell'esperimento scelto dal ricercatore (es. "IoT Latency Test").
    this.name = data.name;

    // Descrizione dello scopo scientifico dell'esperimento.
    // Essenziale per documentare e permettere la riproducibilità.
    this.description = data.description || '';

    // 2. VALIDAZIONE DELLO STATO (ENUM SIMULATO)
    // Gestiamo solo i tre stati concordati per il ciclo di vita di un esperimento.
    // Se la stringa in arrivo non è valida (o è assente), il default è 'stopped'.
    const validStatuses = ['running', 'stopped', 'completed'];
    this.status = validStatuses.includes(data.status) ? data.status : 'stopped';

    // Data di creazione automatica in formato ISO standard (es. "2026-07-20T...")
    this.createdAt = data.createdAt || new Date().toISOString();

    // 3. ALLOCAZIONE DELLE RISORSE (IL "CARRELLO")
    // Questo array è la chiave che collega l'Esperimento alle Risorse.
    // Non salviamo l'intera risorsa, ma solo un "riferimento" strutturato così:
    // { 
    //   resourceId: 1, 
    //   type: "full" | "namespace", 
    //   namespaceName: "test-ns" (opzionale, solo se type è "namespace")
    // }
    this.allocatedResources = Array.isArray(data.allocatedResources) ? data.allocatedResources : [];

    // 4. METADATI DI SUPPORTO (CALCOLATI)
    // Questo è un campo comodissimo generato in automatico dal backend.
    // Permette al frontend di mostrare subito il numerino nella colonna "Allocated Resources"
    // della tabella, senza dover contare manualmente gli elementi dell'array.
    this.resourceCount = this.allocatedResources.length;
  }
}