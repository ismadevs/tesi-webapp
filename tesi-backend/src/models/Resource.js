// ==========================================
// LAYER DEI DATI (MODEL) - Resource.js
// ==========================================
// Questo file definisce la struttura esatta di una "Risorsa" 
// all'interno della piattaforma Slices-RI.

export default class Resource {
  constructor(data) {
    // ==========================================
    // 1. IDENTIFICAZIONE BASE E GERARCHIA
    // ==========================================
    // ID generato internamente dal backend o restituito dalla piattaforma
    this.id = data.id;

    // Il nome testuale ("friendly_name") scelto dall'utente[cite: 1, 2].
    this.name = data.name;

    // Relazione obbligatoria: ogni risorsa DEVE appartenere a un esperimento[cite: 1, 2].
    this.experiment = data.experiment;

    // ==========================================
    // 2. POSIZIONAMENTO E TIPO INFRASTRUTTURA
    // ==========================================
    // Il Site ID è il pilastro architetturale che differenzia il tipo di macchina.
    // VM usano siti come "be-gent1-bi-vm1", mentre le macchine fisiche 
    // usano siti come "be-gent1-bi-baremetal1"[cite: 1, 2].
    this.siteId = data.siteId;

    // ==========================================
    // 3. HARDWARE E SISTEMA OPERATIVO
    // ==========================================
    // Il sistema operativo da installare (es. "Ubuntu 24.04.1" o "Debian 12.7")[cite: 1, 2].
    this.diskImage = data.diskImage;

    // La taglia della macchina.
    // Per le VM sarà qualcosa tipo "m1.small", per i Baremetal "pcgen07" o "pc"[cite: 1, 2].
    this.flavor = data.flavor;

    // ==========================================
    // 4. CICLO DI VITA E AUTOMAZIONE
    // ==========================================
    // La durata dell'istanza prima dell'autodistruzione.
    // Di default viene impostata a "3h"[cite: 2].
    // Nella validazione futura ricorderemo che il tetto massimo è 2160 ore (90 giorni)[cite: 2].
    this.duration = data.duration || "3h";

    // Il numero di risorse identiche da creare contemporaneamente (default 1)[cite: 1, 2].
    this.count = Number(data.count) || 1;

    // ==========================================
    // 5. ACCESSO E SICUREZZA
    // ==========================================
    // Richiesta di un indirizzo IPv4 pubblico[cite: 1, 2].
    this.publicIpv4 = typeof data.publicIpv4 === 'boolean' ? data.publicIpv4 : false;

    // La chiave pubblica (Extra) per registrare il login SSH[cite: 1, 2].
    this.sshKey = data.sshKey || null;

    // ==========================================
    // 6. METADATI DI STATO (Generati dal backend)
    // ==========================================
    // Stati mappati per rispecchiare il reale comportamento delle macchine.
    // Quando la risorsa viene allocata, parte nello stato 'starting'[cite: 2].
    // Quando è pronta per la connessione SSH, passa allo stato 'up'[cite: 2].
    const validStatuses = ['starting', 'up', 'stopped', 'deleted'];
    this.status = validStatuses.includes(data.status) ? data.status : 'starting';

    this.createdAt = data.createdAt || new Date().toISOString();
  }
}