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
    // L'ID numerico univoco generato dal backend. Fallback a null per le nuove creazioni.
    this.id = data.id || null;

    // Il nome dell'esperimento scelto dal ricercatore (es. "Telecontrol Simulator Load Test").
    this.name = data.name || '';

    // Descrizione dello scopo scientifico dell'esperimento.
    // Essenziale per documentare e permettere la riproducibilità.
    this.description = data.description || '';

    // 2. VALIDAZIONE DELLO STATO (ENUM SIMULATO)
    // Gestiamo solo i tre stati concordati per il ciclo di vita di un esperimento.
    // Se la stringa in arrivo non è valida (o è assente), il default è 'stopped'.
    const validStatuses = ['running', 'stopped', 'completed'];
    this.status = validStatuses.includes(data.status) ? data.status : 'stopped';

    // 3. TIMESTAMP
    // Data di creazione automatica in formato ISO standard (es. "2026-07-20T...")
    this.createdAt = data.createdAt || new Date().toISOString();

    // 4. ALLOCAZIONE DELLE RISORSE E GRANULARITÀ (CON DENORMALIZZAZIONE)
    // Questo array è la chiave che collega l'Esperimento alle Risorse.
    // Aggiungiamo un controllo per "pulire" e validare ogni risorsa passata,
    // salvando direttamente anche il NOME della risorsa per evitare query extra dal frontend.
    if (Array.isArray(data.allocatedResources)) {
      this.allocatedResources = data.allocatedResources.map(res => {
        const isNamespace = res.type === 'namespace';
        
        return {
          // L'ID della risorsa a cui ci stiamo collegando
          resourceId: res.resourceId,
          
          // Salviamo direttamente il nome della risorsa (denormalizzazione)
          resourceName: res.resourceName || 'Unknown Resource',
          
          // Forziamo il tipo a "full" se arriva un valore non riconosciuto
          type: isNamespace ? 'namespace' : 'full',
        };
      });
    } else {
      this.allocatedResources = [];
    }

    // 5. METADATI DI SUPPORTO (CALCOLATI)
    // Questo è un campo comodissimo generato in automatico dal backend.
    // Permette al frontend di mostrare subito il numerino nella colonna "Allocated Resources"
    // della tabella, senza dover contare manualmente gli elementi dell'array.
    this.resourceCount = this.allocatedResources.length;
  }
}