// ==========================================
// ROUTING LAYER (ROUTES) - RESOURCES
// ==========================================
import express from 'express';
import * as resourceController from '../controllers/resourceController.js';

const router = express.Router();

// GET /api/resources - Elenco, filtrabile con ?experimentId=exp-...
router.get('/', resourceController.getResources);

// GET /api/resources/catalog - Infrastrutture, flavor e immagini disponibili.
//
// ATTENZIONE ALL'ORDINE: questa riga deve precedere quella con /:id.
// Express valuta le rotte dall'alto verso il basso e si ferma alla prima che
// corrisponde: se /:id venisse prima, una richiesta a /catalog verrebbe
// interpretata come la richiesta della risorsa con identificatore "catalog",
// e risponderebbe 404.
router.get('/catalog', resourceController.getResourceCatalog);

// GET /api/resources/:id - Dettaglio di una singola risorsa
router.get('/:id', resourceController.getResource);

// POST /api/resources - Crea una risorsa in stato DRAFT dentro un esperimento
router.post('/', resourceController.createResource);

// PUT /api/resources/:id - Modifica la specifica (solo se DRAFT)
router.put('/:id', resourceController.updateResource);

// DELETE /api/resources/:id - Elimina la specifica (solo se DRAFT).
// Non distrugge nulla su SLICES: sono due operazioni distinte.
router.delete('/:id', resourceController.deleteResource);

// POST /api/resources/:id/destroy - Libera la macchina su SLICES-RI.
// Verbo POST e non DELETE perché non è la rimozione di una risorsa REST ma la
// richiesta di un'azione sull'infrastruttura. Il documento resta.
router.post('/:id/destroy', resourceController.destroyResource);

export default router;