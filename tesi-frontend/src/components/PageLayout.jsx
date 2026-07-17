import Sidebar from './Sidebar';
import Header from './Header';

// Riceviamo 3 props:
// 1. children: Il contenuto specifico della pagina (es. la TopBar e le Card).
// 2. topPadding: Usa "pt-35" di default (per la Home), ma può essere sovrascritto (es. "pt-8" in Resources).
// 3. layoutClass: Gestisce lo scroll. Di base permette lo scroll ("overflow-y-auto"), ma in Resources lo blocchiamo.
export default function PageLayout({ children, topPadding = "pt-35", layoutClass = "pb-20 overflow-y-auto" }){
  return (
    // ==========================================
    // LIVELLO 1: IL CONTENITORE GLOBALE
    // ==========================================
    // h-screen: Inchioda l'altezza totale esattamente alla dimensione della finestra del browser.
    // overflow-hidden: Il "muro di cinta". Impedisce fisicamente al browser di mostrare la barra 
    //                  di scorrimento generale, a prescindere da quanto siano lunghi i contenuti interni.
    <div className="h-screen flex bg-white text-black overflow-hidden">
      
      {/* La Sidebar si prende la sua larghezza fissa e sta ferma a sinistra */}
      <Sidebar />

      {/* ==========================================
          LIVELLO 2: LA COLONNA DESTRA (Header + Contenuto)
          ========================================== */}
      {/* flex-1: Si allarga per occupare tutto lo spazio orizzontale rimasto.
          flex-col: Dispone l'Header in alto e il contenuto sotto.
          min-h-0: L'ANTIDOTO AL BUG DI FLEXBOX. Di default, Flexbox cerca di espandersi 
                   per contenere i suoi figli. Con min-h-0 gli imponiamo di rispettare i limiti 
                   imposti dal genitore (h-screen), costringendolo a non esplodere verso il basso. */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        
        {/* L'Header occupa i suoi pixel in alto e resta fermo */}
        <Header />

        {/* ==========================================
            LIVELLO 3: IL CONTENITORE DINAMICO (Il "Buco della Serratura")
            ========================================== */}
        {/* max-w-6xl w-full mx-auto: Centrano il contenuto e gli danno una larghezza massima.
            flex-1: Riempi tutto lo spazio verticale rimasto sotto l'Header.
            min-h-0: Stesso antidoto di prima, impedisce a questo div di ingrandirsi all'infinito.
            
            LA SCELTA DEL PADDING (${topPadding}): 
            Abbiamo sostituito 'margin-top' con 'padding-top'. 
            Il margine (margin) crea spazio spingendo fisicamente il box in basso, bucando i confini dello schermo. 
            Il padding, invece, schiaccia il contenuto verso l'interno, mantenendo intatte le pareti del nostro contenitore! */}
        <div className={`max-w-9/10 w-full mx-auto px-1 flex-1 flex flex-col min-h-0 ${topPadding} ${layoutClass}`}>
          
          {/* Qui React inietta la tua pagina vera e propria */}
          {children}
          
        </div>
        
      </main>
    </div>
  );
}