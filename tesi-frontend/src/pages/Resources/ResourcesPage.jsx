import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; 
import { toast } from "react-hot-toast";
import PageLayout from '../../components/PageLayout';
import TopBar from './TopBar';
import ResourceCard from './ResourceCard';
import ResourceDetailsModal from './ResourceDetailsModal';
//import DeleteConfirmModal from './DeleteConfirmModal'; 
//import EditResourceModal from './EditResourceModal'; 
//import AddResourceModal from './AddResourceModal';   

export default function ResourcesPage(){
  // ==========================================
  // 1. GESTIONE DELLO STATO (STATE MANAGEMENT)
  // ==========================================
  // Array che conterrà le risorse Slices-RI (VM o Baremetal)
  const [resources, setResources] = useState([]);
  
  // Stato di caricamento iniziale
  const [isLoading, setIsLoading] = useState(true);
  
  // STATI DELLE MODALI
  const [selectedResource, setSelectedResource] = useState(null); // Modale Info
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);    // Modale Aggiunta
  const [resourceToDelete, setResourceToDelete] = useState(null); // Modale Eliminazione
  const [resourceToEdit, setResourceToEdit] = useState(null);     // Modale Modifica

  // STATO PER LA RICERCA
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // 2. FETCH DEI DATI (CHIAMATA GET AL BACKEND)
  // ==========================================
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/resources');
        
        if (!response.ok) {
          throw new Error('Errore durante la comunicazione con il server');
        }
        
        const data = await response.json();
        setResources(data);
      } catch (error) {
        console.error("Impossibile recuperare le risorse:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchResources();
  }, []); 

  // ==========================================
  // 3. LOGICA DI CREAZIONE (CHIAMATA POST)
  // ==========================================
  const handleCreateResource = async (newResourceData) => {
    const toastId = toast.loading('Allocating new resource...');

    try {
      const response = await fetch('http://localhost:3000/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResourceData) 
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione della risorsa sul server');
      }

      const createdResource = await response.json();

      // Aggiorniamo la griglia locale
      setResources((prev) => [...prev, createdResource]);
      setIsAddModalOpen(false);

      toast.success('Resource allocated successfully!', {
        id: toastId,
        duration: 4000,
      });

    } catch (error) {
      console.error("Errore durante l'allocazione:", error);
      toast.error("Failed to allocate resource.", { id: toastId });
    }
  };

  // ==========================================
  // 4. LOGICA DI ELIMINAZIONE (CHIAMATA DELETE)
  // ==========================================
  const handleDeleteResource = async (id) => {
    const toastId = toast.loading('Destroying resource...');

    try {
      const response = await fetch(`http://localhost:3000/api/resources/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione sul server");
      }

      // Rimuoviamo la risorsa dall'array locale
      setResources((prev) => prev.filter(res => res.id !== id));

      toast.success('Resource destroyed successfully!', {
        id: toastId,
        duration: 4000,
      });

      setResourceToDelete(null);

    } catch (error) {
      console.error("Errore durante la distruzione:", error);
      toast.error('Failed to destroy resource.', { id: toastId });
    }
  };

  // ==========================================
  // 5. LOGICA DI MODIFICA (CHIAMATA PUT)
  // ==========================================
  const handleUpdateResource = async (id, updatedData) => {
    const toastId = toast.loading('Updating resource metadata...');

    try {
      const response = await fetch(`http://localhost:3000/api/resources/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Errore durante la modifica della risorsa sul server');
      }

      const updatedResource = await response.json();

      setResources((prev) => prev.map(res => res.id === id ? updatedResource : res));
      setResourceToEdit(null);

      toast.success('Resource updated successfully!', {
        id: toastId,
        duration: 4000,
      });

    } catch (error) {
      console.error("Errore durante la modifica:", error);
      toast.error('Failed to update resource.', { id: toastId });
    }
  };

  // ==========================================
  // 6. LOGICA DI FILTRAGGIO
  // ==========================================
  // Filtriamo cercando nel nome assegnato o nel Site ID (es. be-gent1-bi-vm1)
  const filteredResources = resources.filter(res => 
    res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (res.siteId && res.siteId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <PageLayout topPadding="pt-0" layoutClass="overflow-hidden relative">
      <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-300">
        
        {/* TOP BAR FISSA IN ALTO */}
        <div className="shrink-0">
          <TopBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenAdd={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* AREA DEL FEED CON SCROLL INDIPENDENTE */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-300" size={28} />
            </div>
          ) : resources.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-lg tracking-wide font-light">
                No resources allocated yet.
              </p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <p className="text-gray-400 text-lg tracking-wide font-light">
                No results found for "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-primary cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onOpenInfo={setSelectedResource}
                  onDeleteResource={setResourceToDelete}
                  onEditResource={setResourceToEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RENDER DELLE MODALI */}
      {selectedResource && (
        <ResourceDetailsModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* 
      {isAddModalOpen && (
        <AddResourceModal existingResources={resources} onSave={handleCreateResource} onClose={() => setIsAddModalOpen(false)} />
      )}
      {resourceToDelete && (
        <DeleteConfirmModal resource={resourceToDelete} onClose={() => setResourceToDelete(null)} onConfirm={handleDeleteResource} />
      )}
      {resourceToEdit && (
        <EditResourceModal resourceToEdit={resourceToEdit} existingResources={resources} onClose={() => setResourceToEdit(null)} onSave={handleUpdateResource} />
      )} 
      */}
    </PageLayout>
  );
}