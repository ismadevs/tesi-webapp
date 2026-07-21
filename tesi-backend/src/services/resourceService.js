// ==========================================
// LAYER DEI SERVIZI (BUSINESS LOGIC)
// ==========================================
// Il Service riceve ordini dal Controller, esegue calcoli complessi,
// applica le regole di business e dialoga con il livello dei Dati.

import { mockResources } from '../models/mockDatabase.js';
import Resource from '../models/Resource.js';

// ==========================================
// FUNZIONE: LETTURA (GET)
// ==========================================
// Va nel "magazzino" e preleva tutti i dati disponibili.
export const getAllResources = () => {
  return mockResources;
};

// ==========================================
// FUNZIONE: CREAZIONE (POST)
// ==========================================
// Riceve 'resourceData', ovvero il JSON grezzo inviato dal frontend.
export const createResource = (resourceData) => {

  // 1. CALCOLO DELL'AUTO-INCREMENTO (SIMULAZIONE DATABASE RELAZIONALE):
  const maxId = mockResources.length > 0 ? Math.max(...mockResources.map(res => res.id)) : 0;
  const newId = maxId + 1;

  // 2. MODELLAZIONE E STRUTTURAZIONE:
  // Passiamo l'oggetto al costruttore 'new Resource()'.
  // Il Model validerà i campi e imposterà i valori di default (es. duration a '3h', status a 'starting').
  const newResource = new Resource({
    ...resourceData,
    id: newId
  });

  // 3. PERSISTENZA (IN MEMORIA):
  mockResources.push(newResource);

  // 4. RITORNO AL MITTENTE:
  return newResource;
};

// ==========================================
// FUNZIONE: ELIMINAZIONE (DELETE)
// ==========================================
// Riceve l'id dal Controller, cerca la risorsa nell'array e la rimuove.
export const deleteResource = (id) => {
  const index = mockResources.findIndex(res => res.id === Number(id));

  if (index === -1) {
    return false;
  }

  mockResources.splice(index, 1);
  return true;
};

// ==========================================
// FUNZIONE: MODIFICA (PUT)
// ==========================================
export const updateResource = (id, updatedData) => {
  // 1. Cerchiamo l'indice della risorsa da modificare
  const index = mockResources.findIndex(res => res.id === Number(id));

  // 2. Se non esiste nel database, ritorniamo null
  if (index === -1) {
    return null;
  }

  // 3. Recuperiamo la "vecchia" versione
  const existingResource = mockResources[index];

  // 4. FUSIONE DEI DATI
  // Sovrascriviamo le vecchie info con updatedData in arrivo dal frontend.
  const mergedData = {
    ...existingResource,
    ...updatedData,
    id: Number(id) // L'ID è intoccabile, forziamo quello originale
  };

  // Creiamo una nuova istanza pulita e validata
  const updatedResource = new Resource(mergedData);

  // 5. Sostituiamo la vecchia risorsa con quella appena generata
  mockResources[index] = updatedResource;

  // 6. Restituiamo la risorsa aggiornata al Controller
  return updatedResource;
};