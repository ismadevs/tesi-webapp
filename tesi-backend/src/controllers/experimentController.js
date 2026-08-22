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

// POST /api/experiments/:id/extend
// La nuova durata arriva nel corpo. Non estende nulla direttamente: aggiorna
// la specifica e porta il documento in EXTEND_REQUESTED.
export const extendExperiment = async (req, res) => {
  try {
    res.status(202).json(
      await experimentService.requestExtend(req.params.id, req.body?.duration)
    );
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/experiments/:id/destroy
// Non distrugge nulla direttamente: porta il documento in DESTROY_REQUESTED
// e risponde 202. Sarà l'orchestratore a invocare la CLI.
export const destroyExperiment = async (req, res) => {
  try {
    res.status(202).json(await experimentService.requestDestroy(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/experiments/:id/export
// Restituisce la specifica come file scaricabile.
export const exportExperiment = async (req, res) => {
  try {
    const spec = await experimentService.exportExperiment(req.params.id);

    // Content-Disposition con attachment dice al browser di scaricare il file
    // invece di mostrarlo, e ne suggerisce il nome. Senza, il JSON si
    // aprirebbe in una scheda.
    const filename = `${spec.spec.name}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Indentato: il file è pensato per essere letto da una persona e
    // versionato con Git, dove un formato compatto produrrebbe diff
    // illeggibili su una riga sola.
    res.status(200).send(JSON.stringify(spec, null, 2));
  } catch (error) {
    handleError(error, res);
  }
};