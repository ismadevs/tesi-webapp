// ==========================================
// LAYER DEI SERVIZI (BUSINESS LOGIC)
// ==========================================
// Il Service è l'operaio specializzato del nostro backend.
// Riceve ordini dal Controller, esegue calcoli complessi, applica le regole
// di business dell'applicazione e dialoga con il livello dei Dati (Model/Database).

import {mockSites} from '../models/mockDatabase.js';
import ResourceSite from '../models/ResourceSite.js';

// ==========================================
// FUNZIONI HELPER PER MOCKING (SOLO PROTOTIPO)
// ==========================================
// Nel mondo cloud reale, queste informazioni vengono assegnate dal server DHCP
// e dai gestori delle identità di Slices. Noi le simuliamo qui.
const generateFakeIP = () => `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 255)}`;

const generateFakeKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


// FUNZIONE: LETTURA (GET)
// Quando il Controller chiama questa funzione, il Service va nel "magazzino"
// e preleva tutti i dati disponibili.
export const getAllSites = () => {
  return mockSites;
};

// FUNZIONE: CREAZIONE (POST)
// Riceve 'siteData', ovvero l'oggetto JSON grezzo inviato dal frontend e
// validato superficialmente dal Controller.
export const createSite = (siteData) => {

  // 1. CALCOLO DELL'AUTO-INCREMENTO (SIMULAZIONE DATABASE RELAZIONALE):
  const maxId = mockSites.length > 0 ? Math.max(...mockSites.map(site => site.id)) : 0;
  const newId = maxId + 1;

  // 2. GENERAZIONE DATI DI CONNESSIONE E METADATI POST-CREAZIONE:
  // Visto che per la UX vogliamo visualizzare subito dati finti senza errori,
  // generiamo un IP e una chiave temporanea al momento della creazione.
  const connectionData = {
    ipAddress: generateFakeIP(),
    accessKey: generateFakeKey()
  };

  // 3. MODELLAZIONE E STRUTTURAZIONE (DATA SHAPING):
  // Passiamo il "super-oggetto" al costruttore 'new ResourceSite()'.
  // Il Model leggerà il 'resourceType' e raggrupperà correttamente l'hardware sotto 'spec'.
  const newSite = new ResourceSite({
    ...siteData,
    id: newId,
    connection: connectionData
  });

  // 4. PERSISTENZA (IN MEMORIA):
  mockSites.push(newSite);

  // 5. RITORNO AL MITTENTE:
  return newSite;
};

// FUNZIONE: ELIMINAZIONE (DELETE)
// Riceve l'id del sito dal Controller, lo cerca nell'array e lo rimuove.
export const deleteSite = (id) => {
  const index = mockSites.findIndex(site => site.id === Number(id));

  if (index === -1) {
    return false;
  }

  mockSites.splice(index, 1);
  return true;
};

// ==========================================
// FUNZIONE: MODIFICA (PUT)
// ==========================================
// Riceve l'id del sito da modificare e i nuovi dati inviati dal frontend.
// Trova l'elemento, lo aggiorna mantenendo la validazione del Model e lo salva.
export const updateSite = (id, updatedData) => {
  // 1. Cerchiamo l'indice del sito da modificare
  const index = mockSites.findIndex(site => site.id === Number(id));

  // 2. Se non esiste nel database, ritorniamo null
  if (index === -1) {
    return null;
  }

  // 3. Recuperiamo la "vecchia" versione del sito
  const existingSite = mockSites[index];

  // 4. FUSIONE DEI DATI E VALIDAZIONE (AGGIORNATO PER IL NUOVO MODELLO)
  // Per ripassare i dati al costruttore ResourceSite senza perdere informazioni,
  // dobbiamo "appiattire" i nuovi blocchi dinamici ('spec' e 'connection')
  // anziché i vecchi 'compute' e 'tech'.
  // Poi sovrascriviamo le vecchie info con updatedData in arrivo dal frontend.
  const mergedData = {
    ...existingSite,
    ...existingSite.spec, // Estrae os, cpuCores, o workerNodes in base al tipo
    ...existingSite.connection, // Estrae IP e Chiavi per non perderli nell'aggiornamento
    ...updatedData,
    id: Number(id) // L'ID è intoccabile, forziamo quello originale
  };

  // Creiamo una nuova istanza pulita e validata che ricostruirà l'albero JSON
  const updatedSite = new ResourceSite(mergedData);

  // 5. Sostituiamo il vecchio sito con quello appena generato
  mockSites[index] = updatedSite;

  // 6. Restituiamo il sito aggiornato al Controller
  return updatedSite;
};