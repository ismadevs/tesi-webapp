// Importiamo il "finto database" (l'array in memoria) dove salveremo i dati
import mockSites from '../models/mockDatabase.js';

// Importiamo la Classe/Model che fa da "stampino" e strutturatore dei metadati
import ResourceSite from '../models/ResourceSite.js';

// Funzione ritorno siti di risorse 
export const getAllSites = () => {
  return mockSites;
};

// Funzione creazione siti di risorse 
export const createSite = (siteData) => {
  
  // 1. CALCOLO DELL'AUTO-INCREMENTO:
  // Dobbiamo capire quale ID assegnare. Guardiamo nel database:
  // Se ci sono già elementi, estraiamo tutti gli ID, cerchiamo il massimo con Math.max e aggiungiamo 1.
  // Se il database è vuoto, partiamo da 1.
  const maxId = mockSites.length > 0 ? Math.max(...mockSites.map(site => site.id)) : 0;
  const newId = maxId + 1;

  // 2. MODELLAZIONE E STRUTTURAZIONE:
  // Uniamo i dati del frontend (siteData) con l'ID numerico appena calcolato.
  // Passiamo questo oggetto unico al costruttore 'new ResourceSite()'.
  // Sarà la classe stessa a dividere i dati in 'compute' e 'tech' e a inserire il timestamp 'lastPing'.
  const newSite = new ResourceSite({
    ...siteData,
    id: newId
  });

  // 3. PERSISTENZA (In memoria):
  // Infiliamo l'oggetto definitivo e formattato dentro il nostro array mock.
  // Da questo preciso istante, il nuovo sito esiste nella RAM del server.
  mockSites.push(newSite);

  // 4. RITORNO AL MITTENTE:
  // Restituiamo il sito creato al Controller, che provvederà a mandarlo a React.
  return newSite;
};
