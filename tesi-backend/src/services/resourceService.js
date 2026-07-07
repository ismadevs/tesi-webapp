// ==========================================
// LAYER DEI SERVIZI (BUSINESS LOGIC)
// ==========================================
// Il Service è l'operaio specializzato del nostro backend. 
// Riceve ordini dal Controller, esegue calcoli complessi, applica le regole 
// di business dell'applicazione e dialoga con il livello dei Dati (Model/Database).

// Importiamo il "finto database" (l'array in memoria) dove salveremo i dati.
// Nelle applicazioni reali con un DB vero (es. CouchDB), qui importeremmo 
// il driver del database per eseguire le query (es. db.find(), db.insert()).
import mockSites from '../models/mockDatabase.js';

// Importiamo la Classe/Model che fa da "stampino" e strutturatore dei metadati.
// Questo ci garantisce che i dati grezzi in arrivo vengano formattati 
// esattamente come richiede la nostra architettura.
import ResourceSite from '../models/ResourceSite.js';

// FUNZIONE: LETTURA (GET)
// Funzione esportata per il ritorno di tutti i siti di risorse.
// Quando il Controller chiama questa funzione, il Service va nel "magazzino"
// (il nostro array in memoria) e preleva tutti i dati disponibili.
export const getAllSites = () => {
  return mockSites;
};

// FUNZIONE: CREAZIONE (POST)
// Funzione esportata per la creazione di nuovi siti di risorse.
// Riceve 'siteData', ovvero l'oggetto JSON grezzo inviato dal frontend e 
// validato superficialmente dal Controller.
export const createSite = (siteData) => {
  
  // 1. CALCOLO DELL'AUTO-INCREMENTO (SIMULAZIONE DATABASE RELAZIONALE):
  // Dobbiamo capire quale ID numerico assegnare al nuovo sito. 
  // Guardiamo nel database:
  // - Se ci sono già elementi (mockSites.length > 0), estraiamo tutti gli ID correnti, 
  //   troviamo il valore massimo con Math.max e aggiungiamo 1.
  // - Se il database è vuoto, partiamo da 0 (così il primo elemento avrà ID 1).
  const maxId = mockSites.length > 0 ? Math.max(...mockSites.map(site => site.id)) : 0;
  const newId = maxId + 1;

  // 2. MODELLAZIONE E STRUTTURAZIONE (DATA SHAPING):
  // Uniamo i dati grezzi del frontend (...siteData) con l'ID numerico appena calcolato.
  // Passiamo questo "super-oggetto" al costruttore 'new ResourceSite()'.
  // Sarà la Classe stessa (il Model) a preoccuparsi di smistare le variabili
  // raggruppandole sotto 'compute', 'tech' e inserendo automaticamente il timestamp in 'lastPing'.
  const newSite = new ResourceSite({
    ...siteData,
    id: newId
  });

  // 3. PERSISTENZA (IN MEMORIA):
  // Infiliamo l'oggetto definitivo e perfettamente formattato dentro il nostro array mock.
  // Da questo preciso istante, il nuovo sito esiste ufficialmente nella RAM del server.
  mockSites.push(newSite);

  // 4. RITORNO AL MITTENTE:
  // Il lavoro dell'operaio è finito. Restituisce l'oggetto completo e formattato 
  // al Controller, il quale provvederà a impacchettarlo e spedirlo a React.
  return newSite;
};