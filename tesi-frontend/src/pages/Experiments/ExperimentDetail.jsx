import { useState } from 'react';
import { ArrowLeft, Calendar, Database, Pencil, Trash2, Box, Info } from 'lucide-react';

import ResourceDetailsModal from '../Resources/ResourceDetailsModal';
import DeleteExperimentModal from './DeleteExperimentModal';

// ==========================================
// EXPERIMENT DETAIL (Presentational Component)
// ==========================================

export default function ExperimentDetail({ experiment, onBack, onDelete }) {
  const [selectedResource, setSelectedResource] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100 w-fit">
            <span className="w-2 h-2 rounded-md bg-emerald-500 animate-pulse"></span>
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 w-fit">
            <span className="w-2 h-2 rounded-md bg-blue-500"></span>
            Completed
          </span>
        );
      case 'stopped':
      default:
        return (
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-md border border-rose-100 w-fit">
            <span className="w-2 h-2 rounded-md bg-rose-500"></span>
            Stopped
          </span>
        );
    }
  };

  // ==========================================
  // HELPER: FETCH INFO RISORSA (WORKAROUND FRONTEND)
  // ==========================================
  const handleOpenResourceInfo = async (resourceId) => {
    try {
      const response = await fetch('http://localhost:3000/api/resources');
      
      if (!response.ok) {
        throw new Error('Errore durante la comunicazione con il server');
      }
      
      const allResources = await response.json();
      const foundResource = allResources.find(res => res.id === resourceId);
      
      if (foundResource) {
        setSelectedResource(foundResource); 
      } else {
        console.error("Risorsa non trovata nel database.");
      }
      
    } catch (error) {
      console.error("Impossibile recuperare i dettagli della risorsa:", error);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300 relative">
      
      {/* ==========================================
          TOP ACTIONS
          ========================================== */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-md font-semibold text-gray-500 hover:text-black transition-colors py-2 pr-4 w-fit group cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Back to Experiments
        </button>
      </div>

      {/* ==========================================
          HEADER SECTION
          ========================================== */}
      <div className="flex flex-col gap-4 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {experiment.name}
          </h1>
          {renderStatusBadge(experiment.status)}
        </div>
        
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
          <Calendar size={15} />
          <span>Created on {formatDate(experiment.createdAt)}</span>
        </div>
      </div>

      {/* ==========================================
          DESCRIPTION SECTION
          ========================================== */}
      <div className="mb-16">
        <p className="text-lg text-black leading-relaxed font-medium">
          {experiment.description || "No description provided."}
        </p>
      </div>

      {/* ==========================================
          RESOURCES SECTION (CARDS GRID)
          ========================================== */}
      <div className="flex-1 mb-12">
        <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-8 flex items-center gap-2">
          <Database size={16} strokeWidth={2.5}/>
          Allocated Resources - {experiment.allocatedResources?.length || 0}
        </h2>

        {(!experiment.allocatedResources || experiment.allocatedResources.length === 0) ? (
          <div className="flex items-center gap-3 text-gray-400 p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
            <Box size={20} />
            <p className="text-sm font-medium">No resources attached to this experiment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {experiment.allocatedResources.map((res, index) => (
              // CARD DELLA RISORSA MINIMALE
              <div 
                key={index} 
                className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 relative flex flex-col h-full group"
              >
                {/* TOP: Solo Titolo */}
                <div>
                  <h3 className="font-bold text-gray-900 truncate text-base" title={res.resourceName}>
                    {res.resourceName}
                  </h3>
                </div>

                {/* BOTTOM: Badge a sinistra e Info a destra */}
                <div className="flex justify-between items-end mt-4">
                  <span className={`border border-gray-200 px-2.5 py-1 text-[11px] font-bold rounded-md uppercase tracking-wider ${
                    res.type === 'full' 
                      ? 'bg-white text-black' 
                      : 'bg-white text-black'
                  }`}>
                    {res.type === 'full' ? 'FULL MACHINE' : 'NAMESPACE'}
                  </span>
                  
                  <button
                    onClick={() => handleOpenResourceInfo(res.resourceId)}
                    className="p-1.5 -mb-0.5 -mr-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    title="View Resource Details"
                  >
                    <Info size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          BOTTOM CONTROLS
          ========================================== */}
      <div className="pt-8 mt-auto flex justify-end items-center gap-4 border-t border-gray-100">

        <button 
          onClick={() => setIsDeleteModalOpen(true)}
          className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-400 flex items-center justify-center gap-2 bg-white text-black border border-gray-200 hover:bg-red-500 hover:text-white hover:border-white cursor-pointer"
        >
          <Trash2 size={16} />
          Delete
        </button>
      </div>
      
      {/* ==========================================
          RENDER DELLA MODALE RISORSE
          ========================================== */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* RENDER DELLA MODALE DI ELIMINAZIONE */}
      {isDeleteModalOpen && (
        <DeleteExperimentModal
          experiment={experiment}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={(id) => {
            setIsDeleteModalOpen(false);
            onDelete(id); // Passa l'azione al componente genitore (ExperimentsPage)
          }}
        />
      )}
      
    </div>
  );
}