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
    default:
      console.error('Errore non gestito:', error);
      return res.status(500).json({ message: 'Errore interno del server.' });
  }
};

// GET /api/resources?experimentId=exp-...
// Il filtro è opzionale nell'API ma di fatto sempre usato dall'interfaccia:
// la sezione Resources è ambita a un esperimento selezionato, coerentemente
// con il fatto che `slices bi list` richiede obbligatoriamente --experiment.
export const getResources = (req, res) => {
  try {
    const { experimentId } = req.query;
    res.status(200).json(resourceService.getAllResources(experimentId || null));
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/resources/catalog
// Restituisce in un colpo solo infrastrutture, flavor e immagini. La cascata
// dei menu (il sito filtra flavor e immagini) viene poi applicata lato client
// senza ulteriori richieste.
export const getResourceCatalog = (req, res) => {
  try {
    res.status(200).json(getCatalog());
  } catch (error) {
    handleError(error, res);
  }
};

// GET /api/resources/:id
export const getResource = (req, res) => {
  try {
    res.status(200).json(resourceService.getResourceById(req.params.id));
  } catch (error) {
    handleError(error, res);
  }
};

// POST /api/resources
export const createResource = (req, res) => {
  try {
    res.status(201).json(resourceService.createResource(req.body));
  } catch (error) {
    handleError(error, res);
  }
};

// PUT /api/resources/:id
export const updateResource = (req, res) => {
  try {
    res.status(200).json(resourceService.updateResource(req.params.id, req.body));
  } catch (error) {
    handleError(error, res);
  }
};

// DELETE /api/resources/:id
export const deleteResource = (req, res) => {
  try {
    resourceService.deleteResource(req.params.id);
    res.status(204).send();
  } catch (error) {
    handleError(error, res);
  }
};