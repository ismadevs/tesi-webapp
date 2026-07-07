// ==========================================
// LAYER DEI DATI (MODEL)
// ==========================================
// Questo file rappresenta lo "stampino" della nostra entità principale. 
// Il Model si assicura che, indipendentemente da chi stia creando o modificando 
// un sito, i dati escano sempre con una struttura rigida, prevedibile e corretta.

export default class ResourceSite {
  // Il costruttore utilizza la destrutturazione ({ ... }).
  // Questo ci permette di passare al costruttore un intero oggetto JSON,
  // e la classe andrà a "pescare" solo i campi che riconosce, ignorando l'eventuale spazzatura.
  constructor({
    id,
    name,
    status,
    cpuCores,
    ramGB,
    storageTB,
    hostingType,
    os,
    ipAddress,
    lastPing
  }) {
    
    // ==========================================
    // IDENTIFICAZIONE BASE
    // ==========================================
    // L'ID è un numero intero. 
    // Quando i dati vengono letti (GET), l'ID arriva già compilato dal mock.
    // Quando faremo la POST, il Service calcolerà l'ID successivo e lo inietterà qui.
    this.id = id;
    
    // Il nome viene preso così com'è. Il Controller si è già assicurato 
    // che non sia vuoto prima ancora di arrivare fin qui.
    this.name = name;

    // ==========================================
    // VALIDAZIONE DELLO STATO (ENUM SIMULATO)
    // ==========================================
    // Creiamo un recinto di sicurezza per lo stato.
    // Se il client invia uno stato non valido (es. "rotto" o "sconosciuto"),
    // il Model fa da scudo e forza il valore di default a "offline", 
    // evitando che la nostra griglia su React si rompa cercando un colore che non esiste.
    const validStatuses = ['online', 'offline', 'maintenance'];
    this.status = validStatuses.includes(status) ? status : 'offline';

    // ==========================================
    // STRUTTURAZIONE: CAPACITÀ COMPUTAZIONALE
    // ==========================================
    // Invece di mantenere i dati "piatti", li annidiamo dentro l'oggetto "compute".
    // La funzione Number() è vitale: se da una form React arriva "32" come stringa di testo,
    // viene convertito in un vero numero matematico. 
    // L'operatore '|| 0' fornisce un fallback sicuro se il dato è del tutto mancante.
    this.compute = {
      cpuCores: Number(cpuCores) || 0,
      ramGB: Number(ramGB) || 0,
      storageTB: Number(storageTB) || 0
    };

    // ==========================================
    // STRUTTURAZIONE: TECNOLOGIE E RETE
    // ==========================================
    // Raggruppiamo i metadati infrastrutturali.
    // Se l'utente in fase di aggiunta non specifica questi dettagli tecnici, 
    // assegniamo delle stringhe di fallback (es. 'Unknown'). Questo previene 
    // i temutissimi errori "undefined" sul frontend.
    this.tech = {
      hostingType: hostingType || 'Unknown',
      os: os || 'Unknown',
      ipAddress: ipAddress || '0.0.0.0'
    };

    // ==========================================
    // METADATI DI MONITORAGGIO
    // ==========================================
    // lastPing indica l'ultimo segnale di vita del dispositivo (fondamentale in un telecontrollo).
    // Se non viene passata una data specifica, il Model "fotografa" 
    // l'istante esatto dell'esecuzione generando un timestamp in formato ISO 
    // (es. "2026-07-07T10:15:30.000Z").
    this.lastPing = lastPing || new Date().toISOString();
  }
}