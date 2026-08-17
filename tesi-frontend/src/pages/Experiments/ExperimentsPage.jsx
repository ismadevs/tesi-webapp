import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

import PageLayout from '../../components/PageLayout';
import TopBar from './TopBar';
import ExperimentsTable from './ExperimentsTable';
import ExperimentDetail from './ExperimentDetail';
import ExperimentFormModal from './ExperimentFormModal.jsx';

const API_URL = 'http://localhost:3000/api/experiments';

// ==========================================
// CONTAINER COMPONENT - EXPERIMENTS PAGE
// ==========================================
// Concentra tutta la comunicazione con il backend. I componenti figli sono
// puramente presentazionali: ricevono dati e richiamano callback, senza sapere
// che esiste una rete.

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Se e' null mostriamo la tabella, altrimenti il dettaglio.
  const [selectedId, setSelectedId] = useState(null);

  // null = chiusa, 'new' = creazione, oggetto = modifica di quell'esperimento.
  const [formTarget, setFormTarget] = useState(null);

  // Il dettaglio legge sempre dalla lista invece di conservare una copia:
  // dopo una modifica la vista si aggiorna da sola, senza sincronizzazioni.
  const selectedExperiment = experiments.find((exp) => exp.id === selectedId) ?? null;

  // ==========================================
  // LETTURA DEL MESSAGGIO DI ERRORE DEL SERVER
  // ==========================================
  // Il backend restituisce un messaggio esplicativo nel corpo della risposta,
  // per esempio il conflitto sul nome gia' occupato. Mostrarlo all'utente e'
  // molto piu' utile di un generico "operazione fallita".
  const readError = async (response, fallback) => {
    try {
      const body = await response.json();
      return body.message || fallback;
    } catch {
      return fallback;
    }
  };

  const fetchExperiments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Unable to load experiments.');
      setExperiments(await response.json());
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  // ==========================================
  // CREAZIONE E MODIFICA
  // ==========================================
  // Restituisce una stringa in caso di errore, cosi' la modale puo' mostrarlo
  // accanto ai campi e restare aperta, oppure undefined in caso di successo.
  const handleSave = async (payload) => {
    const isEditMode = formTarget !== 'new';
    const url = isEditMode ? `${API_URL}/${formTarget.id}` : API_URL;

    try {
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return await readError(response, 'Unable to save the experiment.');
      }

      const saved = await response.json();

      setExperiments((prev) =>
        isEditMode
          ? prev.map((exp) => (exp.id === saved.id ? saved : exp))
          : [saved, ...prev]
      );

      setFormTarget(null);
      toast.success(isEditMode ? 'Experiment updated.' : 'Draft created.');
    } catch {
      return 'Cannot reach the server.';
    }
  };

  // ==========================================
  // ELIMINAZIONE
  // ==========================================
  // Elimina la specifica dalla piattaforma. Non distrugge nulla su SLICES:
  // il backend consente questa operazione solo sulle bozze proprio per evitare
  // che restino macchine allocate senza piu' traccia nella piattaforma.
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        toast.error(await readError(response, 'Unable to delete the experiment.'));
        return;
      }

      setExperiments((prev) => prev.filter((exp) => exp.id !== id));
      setSelectedId(null);
      toast.success('Draft deleted.');
    } catch {
      toast.error('Cannot reach the server.');
    }
  };

  // ==========================================
  // RENDERING
  // ==========================================
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex justify-center items-center text-gray-500 gap-3 mt-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-medium">Loading experiments...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-medium">
          {error}
        </div>
      );
    }

    if (selectedExperiment) {
      return (
        <ExperimentDetail
          experiment={selectedExperiment}
          onBack={() => setSelectedId(null)}
          onEdit={(exp) => setFormTarget(exp)}
          onDelete={handleDelete}
        />
      );
    }

    return (
      <ExperimentsTable
        experiments={experiments}
        onRowClick={(exp) => setSelectedId(exp.id)}
      />
    );
  };

  return (
    <PageLayout topPadding="pt-0" layoutClass="pb-8 overflow-y-auto">
      <div className="animate-in fade-in duration-300 flex flex-col h-full">

        {/* La barra superiore scompare nel dettaglio, dove il titolo
            e' gia' il nome dell'esperimento. */}
        {!selectedExperiment && (
          <TopBar
            title="Experiments"
            description="Compose experiments before allocating them on SLICES-RI"
            onAddClick={() => setFormTarget('new')}
          />
        )}

        <div className="flex-1 flex flex-col min-h-0">
          {renderContent()}
        </div>

        {formTarget && (
          <ExperimentFormModal
            experiment={formTarget === 'new' ? null : formTarget}
            onClose={() => setFormTarget(null)}
            onSave={handleSave}
          />
        )}

      </div>
    </PageLayout>
  );
}