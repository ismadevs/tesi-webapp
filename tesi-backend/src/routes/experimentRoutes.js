// ==========================================
// ROUTING LAYER (ROUTES) - EXPERIMENTS
// ==========================================
// Questo file definisce gli "indirizzi" (endpoint) a cui il frontend può fare richieste.
// Collega ogni URL a una specifica funzione del Controller.

import express from 'express';
import * as experimentController from '../controllers/experimentController.js';

// Inizializziamo il router di Express
const router = express.Router();

/**
 * Endpoint: GET /api/experiments
 * Scopo: Restituire la lista completa degli esperimenti.
 * Azione: Quando qualcuno fa una richiesta GET a questa rotta,
 * Express chiama la funzione 'getExperiments' del controller.
 */
router.get('/', experimentController.getExperiments);

// In futuro aggiungeremo qui le altre rotte, come:
// router.post('/', experimentController.createExperiment);
// router.put('/:id', experimentController.updateExperiment);

export default router;