import { useState, useEffect } from 'react';
import PageLayout from '../../components/PageLayout'; // Adegua il percorso se necessario
import TopBar from './TopBar';

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
        const response = await fetch('/api/experiments');
        
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
        {/* In base alle tue indicazioni, per ora mostriamo solo un box di test */}
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 min-h-[300px]">
           <p className="text-xl font-semibold text-gray-400">
             Table qui
           </p>
        </div>

      </div>
    </PageLayout>
  );
}