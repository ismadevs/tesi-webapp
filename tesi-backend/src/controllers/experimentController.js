// ==========================================
// PRESENTATION LAYER (CONTROLLER) - EXPERIMENTS
// ==========================================
// Questo file gestisce le richieste HTTP in ingresso (req) e le risposte in uscita (res).
// Il suo compito è fare da intermediario: riceve la chiamata dal frontend React,
// delega il lavoro pesante al Service, e formatta la risposta per il client.

import * as experimentService from '../services/experimentService.js';

/**
 * GET /api/experiments
 * Recupera tutti gli esperimenti per popolare la tabella principale.
 */
export const getExperiments = (req, res) => {
  try {
    // 1. Deleghiamo il recupero dei dati al Service
    const experiments = experimentService.getAllExperiments();

    // 2. Rispondiamo al frontend con uno status 200 (OK)
    // e inviamo l'array di esperimenti in formato JSON.
    res.status(200).json(experiments);

  } catch (error) {
    // Se qualcosa va storto (es. nel mondo reale il database è giù),
    // catturiamo l'errore per non far crashare il server e avvisiamo il frontend
    // con uno status 500 (Internal Server Error).
    console.error("Errore durante il recupero degli esperimenti:", error);
    res.status(500).json({ message: "Impossibile recuperare gli esperimenti in questo momento." });
  }
};

// Anche qui, per ora ci fermiamo alla sola operazione di GET (lettura).