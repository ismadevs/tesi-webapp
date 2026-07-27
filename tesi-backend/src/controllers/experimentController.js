// ==========================================
// PRESENTATION LAYER (CONTROLLER) - EXPERIMENTS
// ==========================================
import * as experimentService from '../services/experimentService.js';

export const getExperiments = (req, res) => {
  try {
    const experiments = experimentService.getAllExperiments();
    res.status(200).json(experiments);
  } catch (error) {
    console.error("Errore durante il recupero degli esperimenti:", error);
    res.status(500).json({ message: "Impossibile recuperare gli esperimenti." });
  }
};

export const createExperiment = (req, res) => {
  try {
    const newExp = experimentService.createExperiment(req.body);
    res.status(201).json(newExp);
  } catch (error) {
    console.error("Errore durante la creazione dell'esperimento:", error);
    res.status(500).json({ message: "Impossibile creare l'esperimento." });
  }
};

export const updateExperiment = (req, res) => {
  try {
    const updatedExp = experimentService.updateExperiment(req.params.id, req.body);
    if (!updatedExp) {
      return res.status(404).json({ message: "Esperimento non trovato." });
    }
    res.status(200).json(updatedExp);
  } catch (error) {
    console.error("Errore durante l'aggiornamento dell'esperimento:", error);
    res.status(500).json({ message: "Impossibile aggiornare l'esperimento." });
  }
};

export const deleteExperiment = (req, res) => {
  try {
    const success = experimentService.deleteExperiment(req.params.id);
    if (!success) {
      return res.status(404).json({ message: "Esperimento non trovato." });
    }
    res.status(204).send(); // 204 = No Content (eliminazione avvenuta con successo)
  } catch (error) {
    console.error("Errore durante l'eliminazione dell'esperimento:", error);
    res.status(500).json({ message: "Impossibile eliminare l'esperimento." });
  }
};