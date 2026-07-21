// Importiamo le singole funzioni destrutturate dal Service aggiornato.
import { createResource, getAllResources, deleteResource, updateResource } from '../services/resourceService.js';

// ==========================================
// CONTROLLER PER LA LETTURA (GET)
// ==========================================
export const getResources = (req, res) => {
  try {
    const resources = getAllResources();
    res.status(200).json(resources);
  } catch (error) {
    console.error("🚨 (Resources) ERRORE REALE DURANTE LA GET:", error);
    res.status(500).json({ error: "Errore nel recupero delle risorse" });
  }
};

// ==========================================
// CONTROLLER PER LA CREAZIONE (POST)
// ==========================================
export const addResource = (req, res) => {
  try {
    const resourceData = req.body;

    // 1. VALIDAZIONE BASE E REQUISITI SLICES-RI
    if (!resourceData.name) {
      return res.status(400).json({ error: "Il campo 'name' è obbligatorio." });
    }

    // Le risorse non possono esistere fluttuanti, devono appartenere a un esperimento[cite: 1, 2].
    if (!resourceData.experiment) {
      return res.status(400).json({ error: "Ogni risorsa deve essere associata a un esperimento." });
    }

    // Validiamo i due siti principali della piattaforma.
    const validSites = ['be-gent1-bi-vm1', 'be-gent1-bi-baremetal1'];
    if (!resourceData.siteId || !validSites.includes(resourceData.siteId)) {
      return res.status(400).json({ error: "Devi specificare un 'siteId' valido ('be-gent1-bi-vm1' o 'be-gent1-bi-baremetal1')." });
    }

    // 2. ESECUZIONE DELLA LOGICA
    const newResource = createResource(resourceData);

    // 3. RISPOSTA DI SUCCESSO
    res.status(201).json(newResource);
  } catch (error) {
    console.error("🚨 (Resources) ERRORE REALE DURANTE LA POST:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// ==========================================
// CONTROLLER PER L'ELIMINAZIONE (DELETE)
// ==========================================
export const removeResource = (req, res) => {
  try {
    const { id } = req.params;
    const isDeleted = deleteResource(id);

    if (!isDeleted) {
      return res.status(404).json({ error: `Risorsa con ID ${id} non trovata.` });
    }

    res.status(200).json({ message: "Risorsa eliminata con successo." });
  } catch (error) {
    console.error("🚨 (Resources) ERRORE REALE DURANTE LA DELETE:", error);
    res.status(500).json({ error: "Errore interno del server durante l'eliminazione" });
  }
};

// ==========================================
// CONTROLLER PER LA MODIFICA (PUT)
// ==========================================
export const editResource = (req, res) => {
  try {
    const { id } = req.params;
    const resourceData = req.body;

    // Se prova a modificare il nome, controlliamo che non sia vuoto
    if (resourceData.name !== undefined && !resourceData.name.trim()) {
      return res.status(400).json({ error: "Il campo 'name' non può essere vuoto." });
    }

    const updatedResource = updateResource(id, resourceData);

    if (!updatedResource) {
      return res.status(404).json({ error: `Risorsa con ID ${id} non trovata.` });
    }

    res.status(200).json(updatedResource);
  } catch (error) {
    console.error("🚨 ERRORE REALE DURANTE LA PUT:", error);
    res.status(500).json({ error: "Errore interno del server durante la modifica" });
  }
};