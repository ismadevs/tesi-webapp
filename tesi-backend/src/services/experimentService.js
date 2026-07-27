// ==========================================
// BUSINESS LOGIC LAYER (SERVICE) - EXPERIMENTS
// ==========================================
import { mockExperiments } from '../models/mockDatabase.js';
import Experiment from '../models/Experiment.js';

/**
 * Recupera l'elenco completo di tutti gli esperimenti.
 */
export const getAllExperiments = () => {
  return mockExperiments;
};

/**
 * Crea un nuovo esperimento e lo aggiunge al database.
 */
export const createExperiment = (data) => {
  // Trova l'ID più alto attualmente esistente (o parte da 100 se vuoto)
  const maxId = mockExperiments.reduce((max, exp) => Math.max(max, exp.id), 100);
  
  // Passa i dati al costruttore per formattarli e validare i campi
  const newExperiment = new Experiment({
    ...data,
    id: maxId + 1,
    createdAt: new Date().toISOString()
  });
  
  mockExperiments.push(newExperiment);
  return newExperiment;
};

/**
 * Aggiorna un esperimento esistente tramite ID.
 */
export const updateExperiment = (id, data) => {
  const index = mockExperiments.findIndex(exp => exp.id === Number(id));
  if (index === -1) return null;

  // Uniamo i dati vecchi con quelli nuovi, forzando il mantenimento dell'ID originale
  // Ripassiamo tutto nel costruttore per ricalcolare il resourceCount
  const updatedExperiment = new Experiment({
    ...mockExperiments[index],
    ...data,
    id: Number(id)
  });

  mockExperiments[index] = updatedExperiment;
  return updatedExperiment;
};

/**
 * Elimina un esperimento tramite ID.
 */
export const deleteExperiment = (id) => {
  const index = mockExperiments.findIndex(exp => exp.id === Number(id));
  if (index === -1) return false;
  
  mockExperiments.splice(index, 1);
  return true;
};