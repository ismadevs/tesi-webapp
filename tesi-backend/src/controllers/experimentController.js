// ==========================================
// PRESENTATION LAYER (CONTROLLER) - EXPERIMENTS
// ==========================================
// Unico compito: tradurre fra il mondo HTTP e il livello di servizio.
// Nessuna regola di dominio vive qui.
//
// Rispetto alla versione con dati in memoria gli handler sono asincroni,
// perché ogni accesso al database è una richiesta HTTP verso CouchDB.
// È l'unica differenza: la struttura resta identica.

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

    case 'CouchConflictError':
      // Conflitto di revisione: qualcun altro ha modificato il documento
      // mentre questa richiesta era in corso. Non è un errore del dominio ma
      // di concorrenza, e all'utente basta ricaricare e riprovare.
      return res.status(409).json({
        message: 'Il documento è stato modificato da un\'altra operazione. Ricarica e riprova.',
      });

    case 'DatabaseError':
      // 503: il database non risponde. È indisponibilità del sistema, non
      // un problema della singola richiesta, e va distinta da un errore
      // applicativo perché richiede un intervento diverso.
      console.error('Errore del database:', error.message);
      return res.status(503).json({ message: error.message });

    default:
      console.error('Errore non gestito:', error);
      return res.status(500).json({ message: 'Errore interno del server.' });
  }
};

// GET /api/experiments
export const getExperiments = async (req, res) => {
  try {
    res.status(200).json(await experimentService.getAllExperiments());
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/experiments/:id
export const getExperiment = async (req, res) => {
  try {
    res.status(200).json(await experimentService.getExperimentById(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/experiments
export const createExperiment = async (req, res) => {
  try {
    // 201 Created: la risposta contiene il documento completo, inclusi
    // l'identificatore generato e i timestamp, così il frontend può
    // inserirlo nella tabella senza una seconda richiesta.
    res.status(201).json(await experimentService.createExperiment(req.body));
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/experiments/:id
export const updateExperiment = async (req, res) => {
  try {
    res.status(200).json(
      await experimentService.updateExperiment(req.params.id, req.body)
    );
  } catch (error) {
    handleError(error, res);
  }
};

// DELETE /api/experiments/:id
export const deleteExperiment = async (req, res) => {
  try {
    await experimentService.deleteExperiment(req.params.id);
    // 204 No Content: eliminazione riuscita, nessun corpo da restituire.
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/experiments/:id/deploy
// Non materializza nulla: porta il documento in DEPLOY_REQUESTED e restituisce
// subito. Sarà il controller di orchestrazione a invocare la CLI di SLICES.
// È il motivo per cui la risposta è immediata anche se il provisioning
// richiede minuti.
export const deployExperiment = async (req, res) => {
  try {
    res.status(202).json(await experimentService.requestDeploy(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/experiments/:id/duplicate
// Copia specifica e risorse come nuove bozze. Consentita in qualunque stato:
// non tocca l'infrastruttura.
export const duplicateExperiment = async (req, res) => {
  try {
    res.status(201).json(await experimentService.duplicateExperiment(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};