// ==========================================
// ROUTING LAYER (ROUTES) - EXPERIMENTS
// ==========================================
import express from 'express';
import * as experimentController from '../controllers/experimentController.js';

const router = express.Router();

// GET /api/experiments - Elenco di tutti gli esperimenti (bozze incluse)
router.get('/', experimentController.getExperiments);

// GET /api/experiments/:id - Dettaglio di un singolo esperimento
router.get('/:id', experimentController.getExperiment);

// POST /api/experiments - Crea un esperimento in stato DRAFT
router.post('/', experimentController.createExperiment);

// PUT /api/experiments/:id - Modifica la specifica (solo se DRAFT)
router.put('/:id', experimentController.updateExperiment);

// DELETE /api/experiments/:id - Elimina la specifica (solo se DRAFT).
// Non distrugge nulla su SLICES: sono due operazioni distinte.
router.delete('/:id', experimentController.deleteExperiment);

// POST /api/experiments/:id/duplicate - Copia specifica e risorse come bozze.
// Consentita in qualunque stato: non tocca l'infrastruttura.
router.post('/:id/duplicate', experimentController.duplicateExperiment);

// POST /api/experiments/:id/destroy - Libera esperimento e risorse su SLICES.
// Il documento resta come storico: l'eliminazione è un'azione separata.
router.post('/:id/destroy', experimentController.destroyExperiment);

// POST /api/experiments/:id/deploy - Richiede la materializzazione su SLICES.
// Verbo POST e non PUT perché non è l'aggiornamento di una risorsa ma la
// richiesta di un'azione. Risponde 202 Accepted: la richiesta è stata presa
// in carico, l'esito arriverà in un secondo momento.
router.post('/:id/deploy', experimentController.deployExperiment);

export default router;