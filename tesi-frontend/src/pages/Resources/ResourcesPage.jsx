import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react'; 
import PageLayout from '../../components/PageLayout';
import TopBar from './TopBar';
import ResourceCard from './ResourceCard';
import ResourceDetailsModal from './ResourceDetailsModal';

export default function ResourcesPage(){
  // ==========================================
  // 1. GESTIONE DELLO STATO (STATE MANAGEMENT)
  // ==========================================
  // Array vuoto di partenza per i dati originali dal database
  const [sites, setSites] = useState([]);
  
  // Booleano per mostrare l'icona di caricamento
  const [isLoading, setIsLoading] = useState(true);
  
  // STATO DELLA MODALE: Se è 'null', la modale è invisibile.
  const [selectedSite, setSelectedSite] = useState(null);

  // NUOVO STATO PER LA RICERCA: Salva in tempo reale quello che l'utente scrive nella TopBar
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // 2. FETCH DEI DATI (CHIAMATA AL BACKEND)
  // ==========================================
  useEffect(() => {
    const fetchSites = async () => {
      try {
        // Chiediamo i dati al nostro server Node.js
        const response = await fetch('http://localhost:3000/api/resources');
        
        // Se il server risponde con un errore (es. 404 o 500), forziamo il catch
        if (!response.ok) {
          throw new Error('Errore durante la comunicazione con il server');
        }
        
        // Convertiamo la risposta in un oggetto JavaScript leggibile
        const data = await response.json();
        
        // Salviamo i dati scaricati nello stato principale di React
        setSites(data);
      } catch (error) {
        console.error("Impossibile recuperare i siti:", error);
      } finally {
        // Spegniamo l'icona di caricamento sia che sia andata bene, sia che ci sia stato un errore
        setIsLoading(false); 
      }
    };

    fetchSites();
  }, []); // L'array vuoto indica che questo blocco girerà una sola volta all'apertura della pagina

  // ==========================================
  // 3. LOGICA DI FILTRAGGIO (RICERCA IN TEMPO REALE)
  // ==========================================
  // Creiamo un nuovo array al volo. React lo ricalcola istantaneamente ogni volta che scrivi una lettera.
  // Filtra i 'sites' tenendo solo quelli in cui il nome o l'IP contengono il testo cercato (ignorando maiuscole/minuscole).
  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    site.tech.ipAddress.includes(searchQuery)
  );

  return (
    // layoutClass="relative" è utile per posizionare la modale assoluta in modo corretto
    <PageLayout topPadding="pt-0" layoutClass="overflow-hidden relative">
      
      <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-300">

        {/* TOP BAR FISSA IN ALTO */}
        <div className="shrink-0">
          {/* Passiamo lo stato della ricerca e la funzione per modificarlo al figlio TopBar */}
          <TopBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
        </div>

        {/* AREA DEL FEED CON SCROLL INDIPENDENTE */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">

          {/* RENDER CONDIZIONALE (Ora a 4 vie!) */}
          {isLoading ? (
            /* STATO 1: Caricamento in corso. Mostra solo lo spinner al centro. */
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-gray-300" size={28} />
            </div>
            
          ) : sites.length === 0 ? (
            /* STATO 2: Dati scaricati ma l'array originale è vuoto (Database senza risorse). */
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-400 text-lg tracking-wide font-light">
                Resources will appear here
              </p>
            </div>
            
          ) : filteredSites.length === 0 ? (
            /* STATO 3: Nessun risultato trovato. L'utente ha cercato una parola che non esiste nel DB. */
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <p className="text-gray-400 text-lg tracking-wide font-light">
                Nessun risultato trovato per "{searchQuery}"
              </p>
              {/* Bottone di cortesia per svuotare la barra di ricerca all'istante */}
              <button 
                onClick={() => setSearchQuery("")}
                className="text-sm text-primary cursor-pointer"
              >
                Cancella ricerca
              </button>
            </div>

          ) : (
            /* STATO 4: Dati presenti. Mappiamo 'filteredSites' (l'array filtrato) e generiamo le card! */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSites.map((site) => (
                <ResourceCard 
                  key={site.id} 
                  site={site} 
                  // Passiamo alla Card la funzione per aggiornare lo stato selectedSite (per aprire la modale)
                  onOpenInfo={setSelectedSite} 
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
          4. RENDER DELLA MODALE
          ========================================== */}
      {/* Se 'selectedSite' è vero (quindi ha dei dati), disegna a schermo la modale in overlay */}
      {selectedSite && (
        <ResourceDetailsModal 
          // Passiamo i dati del sito selezionato alla modale
          site={selectedSite} 
          
          // Quando l'utente clicca sulla X o fuori, questa funzione riporta lo stato a null, 
          // nascondendo istantaneamente la modale.
          onClose={() => setSelectedSite(null)} 
        />
      )}

    </PageLayout>
  );
}