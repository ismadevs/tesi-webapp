// ==========================================
// PRESENTATION LAYER (CONTROLLER) - RESOURCES
// ==========================================

import * as resourceService from '../services/resourceService.js';
import { getCatalog } from '../models/catalog.js';

// Stessa traduzione usata per gli esperimenti: il service lancia errori
// tipizzati senza sapere nulla di HTTP, e qui si stabilisce in un punto solo
// la corrispondenza con i codici di stato.
const handleError = (error, res) => {
  switch (error.name) {
    case 'ValidationError':
      return res.status(400).json({ message: error.message, field: error.field });

    case 'NotFoundError':
      return res.status(404).json({ message: error.message });

    case 'ConflictError':
      return res.status(409).json({ message: error.message });

    case 'CouchConflictError':
      // Conflitto di revisione: il documento è stato modificato mentre questa
      // richiesta era in corso. Problema di concorrenza, non di dominio.
      return res.status(409).json({
        message: 'Il documento è stato modificato da un\'altra operazione. Ricarica e riprova.',
      });

    case 'DatabaseError':
      // 503: indisponibilità del sistema, non un problema della richiesta.
      console.error('Errore del database:', error.message);
      return res.status(503).json({ message: error.message });

    default:
      console.error('Errore non gestito:', error);
      return res.status(500).json({ message: 'Errore interno del server.' });
  }
};

// GET /api/resources?experimentId=exp-...
// Il filtro è opzionale nell'API ma di fatto sempre usato dall'interfaccia:
// la sezione Resources è ambita a un esperimento selezionato, coerentemente
// con il fatto che `slices bi list` richiede obbligatoriamente --experiment.
export const getResources = async (req, res) => {
  try {
    const { experimentId } = req.query;
    res.status(200).json(await resourceService.getAllResources(experimentId || null));
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/resources/catalog
// Restituisce in un colpo solo infrastrutture, flavor e immagini. La cascata
// dei menu (il sito filtra flavor e immagini) viene poi applicata lato client
// senza ulteriori richieste.
//
// Non tocca il database: il catalogo è una copia locale di ciò che
// l'infrastruttura offre, quindi resta sincrono.
export const getResourceCatalog = (req, res) => {
  try {
    res.status(200).json(getCatalog());
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/resources/:id
export const getResource = async (req, res) => {
  try {
    res.status(200).json(await resourceService.getResourceById(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/resources
export const createResource = async (req, res) => {
  try {
    res.status(201).json(await resourceService.createResource(req.body));
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/resources/:id
export const updateResource = async (req, res) => {
  try {
    res.status(200).json(await resourceService.updateResource(req.params.id, req.body));
  } catch (error) {
    handleError(error, res);
  }
};

// DELETE /api/resources/:id
export const deleteResource = async (req, res) => {
  try {
    await resourceService.deleteResource(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/resources/:id/destroy
// Non distrugge nulla direttamente: porta il documento in DESTROY_REQUESTED
// e risponde 202. Sarà l'orchestratore a invocare la CLI.
export const destroyResource = async (req, res) => {
  try {
    res.status(202).json(await resourceService.requestDestroy(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};