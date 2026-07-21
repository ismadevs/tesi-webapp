import express from 'express';
import { addResource, getResources, removeResource, editResource } from '../controllers/resourceController.js';

const router = express.Router();

// ==========================================
// DEFINIZIONE DELLE ROTTE (ENDPOINTS)
// ==========================================

// GET /api/resources -> Recupera tutte le risorse
router.get('/', getResources);

// POST /api/resources -> Crea una nuova risorsa
router.post('/', addResource);

// DELETE /api/resources/:id -> Elimina una risorsa specifica
router.delete('/:id', removeResource);

// PUT /api/resources/:id -> Modifica una risorsa specifica
router.put('/:id', editResource);

export default router;