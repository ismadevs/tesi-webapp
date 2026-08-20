// ==========================================
// PRESENTATION LAYER (CONTROLLER) - EXPERIMENTS
// ==========================================
// Unico compito: tradurre fra il mondo HTTP e il livello di servizio.
// Nessuna regola di dominio vive qui.

import * as experimentService from '../services/experimentService.js';

// ==========================================
// TRADUZIONE DEGLI ERRORI IN CODICI HTTP
// ==========================================
// Il servizio lancia errori tipizzati senza sapere nulla di HTTP.
// Questa funzione stabilisce la corrispondenza in un punto solo, evitando
// di ripetere lo stesso blocco try/catch in ogni handler.
const handleError = (error, res) => {
  switch (error.name) {
    case 'ValidationError':
      // 400: i dati inviati non rispettano le regole del dominio.
      // Il campo `field` permette al frontend di evidenziare l'input sbagliato.
      return res.status(400).json({ message: error.message, field: error.field });

    case 'NotFoundError':
      return res.status(404).json({ message: error.message });

    case 'ConflictError':
      // 409: richiesta valida ma incompatibile con lo stato corrente
      // (nome già in uso, oppure modifica di un esperimento materializzato).
      return res.status(409).json({ message: error.message });

    default:
      console.error('Errore non gestito:', error);
      return res.status(500).json({ message: 'Errore interno del server.' });
  }
};

// GET /api/experiments
export const getExperiments = (req, res) => {
  try {
    res.status(200).json(experimentService.getAllExperiments());
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/experiments/:id
export const getExperiment = (req, res) => {
  try {
    res.status(200).json(experimentService.getExperimentById(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/experiments
export const createExperiment = (req, res) => {
  try {
    // 201 Created: la risposta contiene il documento completo, inclusi
    // l'identificatore generato e i timestamp, cosi' il frontend puo'
    // inserirlo nella tabella senza una seconda richiesta.
    res.status(201).json(experimentService.createExperiment(req.body));
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/experiments/:id
export const updateExperiment = (req, res) => {
  try {
    res.status(200).json(experimentService.updateExperiment(req.params.id, req.body));
  } catch (error) {
    handleError(error, res);
  }
};

// DELETE /api/experiments/:id
export const deleteExperiment = (req, res) => {
  try {
    experimentService.deleteExperiment(req.params.id);
    // 204 No Content: eliminazione riuscita, nessun corpo da restituire.
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/experiments/:id/duplicate
export const duplicateExperiment = (req, res) => {
  try {
    res.status(201).json(experimentService.duplicateExperiment(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/experiments/:id/deploy
// Non materializza nulla: porta il documento in DEPLOY_REQUESTED e restituisce
// subito. Sara' il controller di orchestrazione a invocare la CLI di SLICES.
// E' il motivo per cui la risposta e' immediata anche se il provisioning
// richiede minuti.
export const deployExperiment = (req, res) => {
  try {
    res.status(202).json(experimentService.requestDeploy(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};