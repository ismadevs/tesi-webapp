// ==========================================
// ROUTING LAYER (ROUTES) - EXPERIMENTS
// ==========================================
import express from 'express';
import * as experimentController from '../controllers/experimentController.js';

const router = express.Router();

// GET /api/experiments - Legge tutti gli esperimenti
router.get('/', experimentController.getExperiments);

// POST /api/experiments - Crea un nuovo esperimento
router.post('/', experimentController.createExperiment);

// PUT /api/experiments/:id - Modifica un esperimento esistente
router.put('/:id', experimentController.updateExperiment);

// DELETE /api/experiments/:id - Elimina un esperimento
router.delete('/:id', experimentController.deleteExperiment);

export default router;