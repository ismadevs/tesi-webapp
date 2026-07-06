import express from 'express';
import { addSite, getSites } from '../controllers/resourceController.js';

const router = express.Router();

// Rotta per aggiunta dei siti di risorse
router.post('/', addSite);

// Rotta per ritorno dei siti di risorse
router.get('/', getSites);

export default router;