import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; 
import { toast } from "react-hot-toast";
import PageLayout from '../../components/PageLayout';
import TopBar from './TopBar';
import ResourceCard from './ResourceCard';
import ResourceDetailsModal from './ResourceDetailsModal';
import DeleteConfirmModal from './DeleteConfirmModal'; 
import EditSiteModal from './EditSiteModal'; // 

// 1. IMPORTIAMO LA NUOVA MODALE
import AddSiteModal from './AddSiteModal';

export default function ResourcesPage(){
  // ==========================================
  // 1. GESTIONE DELLO STATO (STATE MANAGEMENT)
  // ==========================================
  // Array vuoto di partenza per i dati originali dal database
  const [sites, setSites] = useState([]);
  
  // Booleano per mostrare l'icona di caricamento
  const [isLoading, setIsLoading] = useState(true);
  
  // STATO DELLA MODALE INFO: Se è 'null', la modale è invisibile.
  const [selectedSite, setSelectedSite] = useState(null);

  // STATO DELLA MODALE AGGIUNTA (POST): Controlla se il form di creazione è aperto
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // STATO DELLA MODALE ELIMINAZIONE (DELETE): Salva l'intero oggetto del sito che si sta per eliminare. Se è null, la modale è chiusa.
  const [siteToDelete, setSiteToDelete] = useState(null);

  // STATO MODALE MODIFICA: Memorizza il sito da modificare. Se valorizzato, apre la modale.
  const [siteToEdit, setSiteToEdit] = useState(null);

  // STATO PER LA RICERCA: Salva in tempo reale quello che l'utente scrive nella TopBar
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // 2. FETCH DEI DATI (CHIAMATA GET AL BACKEND)
  // ==========================================
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/resources');
        
        if (!response.ok) {
          throw new Error('Errore durante la comunicazione con il server');
        }
        
        const data = await response.json();
        setSites(data);
      } catch (error) {
        console.error("Impossibile recuperare i siti:", error);
      } finally {
        setIsLoading(false); 
      }
    };

    fetchSites();
  }, []); 

  // ==========================================
  // 3. LOGICA DI CREAZIONE (CHIAMATA POST AL BACKEND)
  // ==========================================
  // Questa funzione viene chiamata DALLA modale AddSiteModal quando l'utente preme "Create Site"
  // e il form ha superato tutte le validazioni.
  const handleCreateSite = async (newSiteData) => {

    // Salviamo un riferimento al toast di caricamento
    const toastId = toast.loading('Creating site...');

    try {
      // Configuriamo la chiamata fetch per inviare dati (POST)
      const response = await fetch('http://localhost:3000/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Diciamo al server che stiamo inviando un JSON
        },
        // Convertiamo il nostro oggetto JavaScript in una stringa JSON per viaggiare sulla rete
        body: JSON.stringify(newSiteData) 
      });

      if (!response.ok) {
        throw new Error('Errore nella creazione del sito sul server');
      }

      // Il backend ci risponde con l'oggetto appena creato (completo dell'ID auto-generato)
      const createdSite = await response.json();

      // Aggiorniamo la griglia: prendiamo i siti vecchi e aggiungiamo quello nuovo alla fine
      setSites((prevSites) => [...prevSites, createdSite]);

      // Chiudiamo la modale automaticamente
      setIsAddModalOpen(false);

      // TOAST DI SUCCESSO! Sostituiamo il toast di caricamento con quello verde
      toast.success('Resource site added successfully!', {
        id: toastId, // Aggiorna il toast esistente invece di crearne uno nuovo
        duration: 4000, // Lo lasciamo a schermo per 4 secondi
      });

    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      // TOAST DI ERRORE! Sostituiamo il toast di caricamento con quello rosso
      toast.error("Failed to create resource site.", {
        id: toastId,
      });
    }
  };

  // ==========================================
  // FUNZIONE DI ELIMINAZIONE (DELETE)
  // ==========================================
  const handleDeleteSite = async (id) => {
    // Iniziamo mostrando un toast di caricamento (molto pro)
    const toastId = toast.loading('Deleting resource site...');

    try {
      // Spariamo la richiesta DELETE includendo l'id nell'URL
      const response = await fetch(`http://localhost:3000/api/resources/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error("Errore durante l'eliminazione sul server");
      }

      // Se il server risponde con successo, aggiorniamo lo stato locale in tempo reale.
      // Usiamo il metodo filter per tenere nell'array solo i siti che NON hanno l'id appena eliminato.
      setSites((prevSites) => prevSites.filter(site => site.id !== id));

      // Sostituiamo il toast di caricamento con quello di successo
      toast.success('Resource site deleted successfully!', {
        id: toastId,
        duration: 4000,
      });

      // Svuota lo stato e nasconde la modale di conferma
      setSiteToDelete(null);

    } catch (error) {
      console.error("Errore durante l'eliminazione:", error);
      // In caso di errore aggiorniamo il toast con il messaggio rosso
      toast.error('Failed to delete resource site.', {
        id: toastId,
      });
    }
  };

  // ==========================================
  // FUNZIONE DI MODIFICA (PUT)
  // ==========================================
  const handleUpdateSite = async (id, updatedData) => {
    // Avviamo il toast di caricamento per una UX fluida
    const toastId = toast.loading('Updating resource site...');

    try {
      // Eseguiamo la chiamata PUT specificando l'ID nell'URL
      const response = await fetch(`http://localhost:3000/api/resources/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });

      if (!response.ok) {
        throw new Error('Errore durante la modifica del sito sul server');
      }

      // Il backend ci restituisce l'oggetto appena aggiornato e validato dal Model
      const updatedSite = await response.json();

      // Aggiorniamo lo stato: mappiamo l'array esistente e, quando troviamo l'ID corretto,
      // sostituiamo il vecchio oggetto con quello nuovo restituito da Node.js
      setSites((prevSites) => prevSites.map(site => site.id === id ? updatedSite : site));

      // Chiudiamo la modale di modifica
      setSiteToEdit(null);

      // Trasformiamo il toast in successo
      toast.success('Resource site updated successfully!', {
        id: toastId,
        duration: 4000,
      });

    } catch (error) {
      console.error("Errore durante la modifica:", error);
      // Trasformiamo il toast in errore
      toast.error('Failed to update resource site.', {
        id: toastId,
      });
    }
  };

  // ==========================================
  // LOGICA DI FILTRAGGIO (RICERCA IN TEMPO REALE)
  // ==========================================
  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.tech.ipAddress.includes(searchQuery)
  );

  return (
    <PageLayout topPadding="pt-0" layoutClass="overflow-hidden relative">
      <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-300">
        {/* TOP BAR FISSA IN ALTO */}
        <div className="shrink-0">
          <TopBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            // Passiamo alla TopBar la funzione per aprire la modale quando si clicca "New Site"
            onOpenAdd={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* AREA DEL FEED CON SCROLL INDIPENDENTE */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          {/* RENDER CONDIZIONALE */}
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-300" size={28} />
            </div>
          ) : sites.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-lg tracking-wide font-light">
                Resources will appear here
              </p>
            </div>
          ) : filteredSites.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <p className="text-gray-400 text-lg tracking-wide font-light">
                No results found for "{searchQuery}"
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm text-primary cursor-pointer"
              >
                Cancel Search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSites.map((site) => (
                <ResourceCard
                  key={site.id}
                  site={site}
                  onOpenInfo={setSelectedSite}
                  onDeleteSite={setSiteToDelete}
                  onEditSite={setSiteToEdit}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          5. RENDER MODALE INFO (Dettagli Sito)
          ========================================== */}
      {selectedSite && (
        <ResourceDetailsModal
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
        />
      )}

      {/* ==========================================
          6. RENDER MODALE AGGIUNTA (Nuovo Sito)
          ========================================== */}
      {isAddModalOpen && (
        <AddSiteModal
          existingSites={sites} // Per il controllo dei doppioni sul form
          onSave={handleCreateSite} // La funzione da eseguire al Submit
          onClose={() => setIsAddModalOpen(false)} // Per chiudere premendo X o fuori
        />
      )}

      {/* ==========================================
          7. RENDER MODALE DI CONFERMA ELIMINAZIONE
          ========================================== */}
      {siteToDelete && (
        <DeleteConfirmModal
          site={siteToDelete}
          onClose={() => setSiteToDelete(null)} // Chiude senza eliminare
          onConfirm={handleDeleteSite} // Avvia la vera cancellazione passando l'id
        />
      )}

      {/* ==========================================
          8. RENDER MODALE MODIFICA (PUT)
          ========================================== */}
      {siteToEdit && (
        <EditSiteModal
          siteToEdit={siteToEdit} // Passiamo l'oggetto da pre-compilare
          existingSites={sites} // Per il controllo anti-doppione sul nome
          onClose={() => setSiteToEdit(null)} // Per chiudere premendo X o Cancel
          onSave={handleUpdateSite} // La funzione fetch che esegue la PUT
        />
      )}
      
    </PageLayout>
  );
}