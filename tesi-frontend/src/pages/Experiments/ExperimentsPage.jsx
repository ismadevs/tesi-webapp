import { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout'; // Adegua il percorso se necessario
import TopBar from './TopBar';
import ExperimentsTable from './ExperimentsTable';
import ExperimentDetail from './ExperimentDetail';

// ==========================================
// CONTAINER COMPONENT - EXPERIMENTS PAGE
// ==========================================
export default function ExperimentsPage() {
  // 1. STATI DEL COMPONENTE
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Stato chiave: se è 'null' mostriamo la Tabella, se ha un oggetto mostriamo il Dettaglio
  const [selectedExperiment, setSelectedExperiment] = useState(null);

  // 2. FETCH DEI DATI DAL BACKEND
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
      <div className="animate-in fade-in duration-300 flex flex-col h-full">
        
        {/* TOPBAR DINAMICA */}
        <TopBar 
          title={topBarProps.title}
          description={topBarProps.description}
          showAddButton={topBarProps.showAddButton}
        />

        {/* CONTENUTO PRINCIPALE */}
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
            
            // ==========================================
            // VISTA: DETTAGLIO ESPERIMENTO
            // ==========================================
            <ExperimentDetail 
              experiment={selectedExperiment} 
              onBack={() => {
                // 1. Svuotiamo lo stato per far riapparire la tabella
                setSelectedExperiment(null);
                // 2. Ripristiniamo l'URL originale
                window.history.pushState({}, '', '/experiments');
              }}
            />
            
          ) : (
            
            // ==========================================
            // VISTA: TABELLA PRINCIPALE
            // ==========================================
            <ExperimentsTable 
               experiments={experiments} 
               onRowClick={(exp) => {
                 // 1. Salviamo l'esperimento nello stato
                 setSelectedExperiment(exp);
                 
                 // 2. Creiamo uno "slug" pulito per l'URL (es. "Load Test" -> "load-test")
                 const urlSlug = exp.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                 
                 // 3. Aggiorniamo l'URL nel browser senza ricaricare la pagina
                 window.history.pushState({}, '', `/experiments/${urlSlug}`);
               }} 
            />
            
          )}
        </div>

      </div>
    </PageLayout>
  );
}