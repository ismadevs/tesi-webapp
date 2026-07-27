import { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout'; 
import TopBar from './TopBar';
import { toast } from "react-hot-toast";
import ExperimentsTable from './ExperimentsTable';
import ExperimentDetail from './ExperimentDetail';
import AddExperimentModal from './AddExperimentModal';

// ==========================================
// CONTAINER COMPONENT - EXPERIMENTS PAGE
// ==========================================
export default function ExperimentsPage() {
  // 1. STATI DEL COMPONENTE
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // NUOVI STATI PER LA MODALE E LE RISORSE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [availableResources, setAvailableResources] = useState([]);
  
  // Stato chiave: se è 'null' mostriamo la Tabella, se ha un oggetto mostriamo il Dettaglio
  const [selectedExperiment, setSelectedExperiment] = useState(null);

  // 2. FETCH DEI DATI DAL BACKEND (ESPERIMENTI)
  useEffect(() => {
    const fetchExperiments = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:3000/api/experiments');
        
        if (!response.ok) {
          throw new Error('Errore nel recupero degli esperimenti.');
        }
        
        const data = await response.json();
        setExperiments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExperiments();
  }, []);

  // 2B. FETCH DELLE RISORSE (Servono per la modale di creazione)
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/resources');
        if (response.ok) {
          const data = await response.json();
          setAvailableResources(data);
        }
      } catch (err) {
        console.error("Errore nel recupero delle risorse:", err);
      }
    };
    
    fetchResources();
  }, []);

  // ==========================================
  // FUNZIONE PER CREARE UN NUOVO ESPERIMENTO
  // ==========================================
  const handleCreateExperiment = async (newExperimentData) => {
    const toastId = toast.loading('Creating new experiment...');

    try {
      const response = await fetch('http://localhost:3000/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExperimentData),
      });

      if (!response.ok) throw new Error("Errore durante la creazione dell'esperimento");
      
      const createdExp = await response.json();
      
      setExperiments(prev => [...prev, createdExp]);
      setIsAddModalOpen(false);

      toast.success('Experiment created successfully!', {
        id: toastId,
        duration: 4000,
      });

    } catch (err) {
      console.error("Salvataggio fallito:", err);
      toast.error("Failed to create experiment.", { id: toastId });
    }
  };

  // ==========================================
  // FUNZIONE PER ELIMINARE UN ESPERIMENTO
  // ==========================================
  const handleDeleteExperiment = async (id) => {
    const toastId = toast.loading('Deleting experiment...');

    try {
      const response = await fetch(`http://localhost:3000/api/experiments/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione sul server");
      }

      // Rimuove l'esperimento eliminato dalla tabella
      setExperiments((prev) => prev.filter(exp => exp.id !== id));
      
      // Chiude la pagina di dettaglio e reindirizza alla tabella
      setSelectedExperiment(null);
      window.history.pushState({}, '', '/experiments');

      toast.success('Experiment deleted successfully!', {
        id: toastId,
        duration: 4000,
      });

    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      toast.error('Failed to delete experiment.', { id: toastId });
    }
  };

  // 3. LOGICA DINAMICA PER LA TOPBAR
  const topBarProps = selectedExperiment
    ? {
        title: selectedExperiment.name,
        description: "View and manage the details of this execution environment",
        showAddButton: false,
      }
    : {
        title: "Experiments",
        description: "Manage and monitor your execution environments",
        showAddButton: true,
      };

  // 4. RENDERING CON IL TUO LAYOUT
  return (
    <PageLayout topPadding="pt-0" layoutClass="pb-8 overflow-y-auto">
      <div className="animate-in fade-in duration-300 flex flex-col h-full relative">
        
        {!selectedExperiment && (
          <TopBar 
            title={topBarProps.title}
            description={topBarProps.description}
            showAddButton={topBarProps.showAddButton}
            onAddClick={() => setIsAddModalOpen(true)} 
          />
        )}

        <div className="flex-1 flex flex-col min-h-0">
          
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center text-gray-500 gap-3 mt-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium">Caricamento esperimenti...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 font-medium">
              {error}
            </div>
          ) : selectedExperiment ? (
            
            <ExperimentDetail 
              experiment={selectedExperiment} 
              onBack={() => {
                setSelectedExperiment(null);
                window.history.pushState({}, '', '/experiments');
              }}
              // AGGIUNTA LA FUNZIONE ONDELETE QUI!
              onDelete={handleDeleteExperiment} 
            />
            
          ) : (
            
            <ExperimentsTable 
               experiments={experiments} 
               onRowClick={(exp) => {
                 setSelectedExperiment(exp);
                 const urlSlug = exp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                 window.history.pushState({}, '', `/experiments/${urlSlug}`);
               }} 
            />
            
          )}
        </div>

        {isAddModalOpen && (
          <AddExperimentModal
            availableResources={availableResources}
            onClose={() => setIsAddModalOpen(false)}
            onSave={handleCreateExperiment}
          />
        )}

      </div>
    </PageLayout>
  );
}