// ==========================================
// BUSINESS LOGIC LAYER (SERVICE) - EXPERIMENTS
// ==========================================
// Questo file contiene la logica "core" per la gestione degli esperimenti.
// Il Service fa da ponte tra il Controller (che gestisce le richieste HTTP)
// e il Database (in questo caso il nostro mock).

import mockExperiments from '../data/mockExperiments.js';

/**
 * Recupera l'elenco completo di tutti gli esperimenti.
 * Questa funzione è tutto ciò che ci serve per popolare la tabella
 * principale nella ExperimentsPage del frontend.
 *
 * @returns {Array}Array di oggetti Experiment
 */
export const getAllExperiments = () => {
  // Al momento restituiamo semplicemente l'array fittizio.
  // In un ambiente di produzione reale, qui ci sarebbe una chiamata
  // asincrona al database (es. con Mongoose per MongoDB o Prisma per SQL),
  // tipo: return await ExperimentModel.find({});
  return mockExperiments;
};