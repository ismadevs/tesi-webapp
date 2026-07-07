// Importiamo il framework Express. Questo è necessario perché il Router
// è una funzionalità integrata direttamente all'interno della libreria Express.
import express from 'express';

// Importiamo le funzioni specifiche dal nostro Controller.
// Utilizziamo la destrutturazione (le parentesi graffe {}) per estrarre 
// solo le funzioni 'addSite' e 'getSites' dal file resourceController.js.
import { addSite, getSites, removeSite } from '../controllers/resourceController.js';

// Creiamo un'istanza del Router di Express.
// Il 'router' agisce come un mini-server o un "vigile urbano" isolato
// che si occuperà esclusivamente di smistare il traffico per questo gruppo di rotte.
const router = express.Router();

// ==========================================
// DEFINIZIONE DELLE ROTTE (ENDPOINTS)
// ==========================================

// Rotta per aggiunta dei siti di risorse
// Quando il server riceve una richiesta HTTP POST all'indirizzo radice di questo router ('/'),
// Express delega immediatamente l'esecuzione alla funzione 'addSite' del Controller.
router.post('/', addSite);

// Rotta per ritorno dei siti di risorse
// Quando il server riceve una richiesta HTTP GET all'indirizzo radice di questo router ('/'),
// Express delega l'esecuzione alla funzione 'getSites' del Controller, che si occuperà di recuperare i dati.
router.get('/', getSites);

// Rotta per l'eliminazione di un sito di risorse tramite ID
// Il costrutto '/:id' indica ad Express che quella parte dell'URL è dinamica
// Una richiesta verso /api/resources/2 attiverà questo endpoint e l'ID sarà disponibile nel controller
router.delete('/:id', removeSite);

// Esportiamo l'istanza del router appena configurata come esportazione di default.
// In questo modo, il file principale (server.js) potrà importare questo router 
// e "montarlo" su un percorso specifico (es. app.use('/api/resources', resourceRoutes)).
export default router;