// Importiamo le singole funzioni destrutturate dal Service
import { createSite, getAllSites } from '../services/resourceService.js';

export const getSites = (req, res) => {
  try {
    // CORREZIONE: Usiamo direttamente la funzione importata!
    const sites = getAllSites();
    
    res.status(200).json(sites);
  } catch (error) {
    console.error("🚨 ERRORE REALE DURANTE LA GET:", error); 
    res.status(500).json({ error: "Errore nel recupero dei siti" });
  }
};

export const addSite = (req, res) => {
  try {
    const siteData = req.body;
    
    if (!siteData.name) {
      return res.status(400).json({ error: "Il campo 'name' è obbligatorio." });
    }

    // CORREZIONE: Usiamo direttamente createSite!
    const newSite = createSite(siteData);
    
    res.status(201).json(newSite);
  } catch (error) {
    console.error("Errore durante la creazione del sito:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};