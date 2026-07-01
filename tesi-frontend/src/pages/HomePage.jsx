import { useState } from 'react';
import keycloakConfig from '../services/keycloak';
import { LogOut, CloudUpload, DatabasePlus, Boxes } from 'lucide-react';

export default function HomePage() {
  // Mantengo lo stato che mi permette di sapere quale sezione è attualmente visualizzata
  const [activeTab, setActiveTab] = useState('home');

  const handleLogout = () => {
    // Rimuovo il flag del benvenuto così al prossimo login riapparirà il toast verde
    sessionStorage.removeItem("hasSeenWelcome");
    // Diciamo a Keycloak di riportarci direttamente sulla root ("/") dopo il logout.
    // In questo modo evitiamo di atterrare su /home da sloggati.
    keycloakConfig.logout({
      redirectUri: window.location.origin,
    });
  };

  const getSidebarItemStyle = (tabName) => {
    // Definisco lo stile di base dei link. 
    // - group: mi permette in futuro di far reagire elementi interni all'hover sul genitore.
    // - flex items-center gap-4: allinea orizzontalmente l'icona al testo e crea uno spazio di 16px (4 * 4px) tra loro.
    // - transition-colors: rende il cambio di colore fluido e non a scatto.
    // - cursor-pointer: mostra la manina quando passo sopra con il mouse.
    const baseStyle = "group flex items-center gap-4 text-xl transition-colors cursor-pointer w-full";
    
    if (activeTab === tabName) {
      // Se il tab è attivo, uso font-bold (grassetto forte) e text-primary (il mio blu).
      return `${baseStyle} font-bold text-primary`;
    }
    
    // Se il tab NON è attivo, parto da un testo nero semi-grassetto (font-semibold).
    // Quando faccio hover, il testo diventa primario e il grassetto aumenta (font-bold).
    return `${baseStyle} font-semibold text-black hover:text-primary hover:font-bold`;
  };

  return (
    // min-h-screen: garantisce che il div bianco occupi ALMENO tutta l'altezza dello schermo.
    // flex: imposta il layout orizzontale in modo da affiancare la sidebar e il contenuto.
    <div className="min-h-screen flex bg-white text-black">
      
      {/* ============================================
          SIDEBAR FLAT
          ============================================ */}
      {/* 
        w-80: larghezza fissa di 320px (80 * 4px).
        h-screen: altezza pari al 100% della finestra visibile (viewport).
        sticky top-0: "incolla" la sidebar in alto; se il contenuto a destra scorre, la sidebar resta ferma.
        py-12: aggiunge un padding verticale in alto e in basso per far "respirare" la linea divisoria.
      */}
      <aside className="w-80 h-screen sticky top-0 py-12">
        {/* h-full: il div interno occupa tutto lo spazio lasciato libero dal padding py-12.
            border-r border-gray-200: crea la sottile linea grigia solo sul lato destro.
            flex flex-col justify-center: centra il menu perfettamente a metà dell'altezza. */}
        <div className="h-full border-r border-gray-200 flex flex-col justify-center">
          
          {/* gap-10: crea una distanza di 40px tra i bottoni della navigazione.
              pl-18: spinge i bottoni verso destra allontanandoli dal bordo sinistro. */}
          <nav className="flex flex-col gap-10 pl-18">
            <button 
              onClick={() => setActiveTab('home')}
              className={getSidebarItemStyle('home')}
            >
              <CloudUpload strokeWidth={activeTab === 'home' ? 2 : 2} size={26} />
              <span>Home</span>
            </button>

            <button 
              onClick={() => setActiveTab('resources')}
              className={getSidebarItemStyle('resources')}
            >
              <DatabasePlus strokeWidth={activeTab === 'resources' ? 2 : 2} size={26} />
              <span>Resources</span>
            </button>

            <button 
              onClick={() => setActiveTab('simulations')}
              className={getSidebarItemStyle('simulations')}
            >
              <Boxes strokeWidth={activeTab === 'simulations' ? 2 : 2} size={26} />
              <span>Simulations</span>
            </button>
          </nav>

        </div>
      </aside>

      {/* ============================================
          AREA CONTENUTO PRINCIPALE
          ============================================ */}
      {/* flex-1: dice a questo contenitore (il main) di espandersi e prendersi tutto lo spazio orizzontale rimanente a destra della sidebar. */}
      <main className="flex-1 flex flex-col">
        
        {/* HEADER */}
        {/* h-28: imposta un'altezza fissa per la barra in alto.
            justify-end: spinge il contenuto (il bottone logout) tutto verso destra. */}
        <header className="h-28 flex justify-end items-center px-12">
          {/* rounded-lg: arrotonda leggermente gli angoli.
              shadow-sm: applica una piccolissima ombra che dà profondità. */}
          <button 
            onClick={handleLogout} 
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 bg-white text-black border border-gray-200 hover:bg-red-500 hover:text-white hover:border-white cursor-pointer"
          >
            <span>Sign Out</span>
            <LogOut size={16} strokeWidth={2.5} />
          </button>
        </header>

        {/* CONTENUTO DINAMICO */}
        {/* max-w-5xl: impedisce al testo di diventare troppo largo e illeggibile sui grandi schermi.
            mx-auto: centra il div all'interno dell'area a disposizione.
            mt-32: (margin-top) spinge il blocco verso il basso, allontanandolo dall'header. */}
        <div className="max-w-5xl w-full mx-auto px-12 pb-20 mt-32">
          
          {activeTab === 'home' && (
            // animate-in fade-in: classi di utilità (spesso aggiunte dai plugin Tailwind come tailwindcss-animate) per animare l'entrata.
            <div className="animate-in fade-in duration-500">
              {/* text-4xl md:text-5xl: testo grande che diventa ancora più grande (5xl) da schermi medi in su (md:).
                  tracking-tight: avvicina leggermente le lettere (stile molto moderno, alla Apple). */}
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-12">
                Overview
              </h2>
              
              {/* leading-relaxed: aumenta lo spazio tra le righe per far respirare la lettura. */}
              <p className="text-xl leading-relaxed text-gray-700">
                This web application is designed to support researchers in managing computational 
                resources and configuring scientific experiments. In the{' '}
                <button 
                  onClick={() => setActiveTab('resources')}
                  className="text-primary font-bold cursor-pointer transition-colors"
                >
                  Resources
                </button>
                {' '}section, it is possible to catalog and administer available servers, defining 
                their hardware and software characteristics, such as computational capacity, memory, 
                and hosting technologies. The{' '}
                <button 
                  onClick={() => setActiveTab('simulations')}
                  className="text-primary font-bold cursor-pointer transition-colors"
                >
                  Simulations
                </button>
                {' '}section allows you to create and manage computing scenarios, associating one or 
                more resources to the experiments to achieve reproducible and easily monitored 
                configurations. The platform simplifies infrastructure organization and constitutes 
                the foundation for automated execution of workloads in cloud-native environments.
              </p>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="animate-in fade-in duration-300">
               <h2 className="text-3xl font-bold tracking-tight text-gray-800 mb-12">
                 Resources Section
               </h2>
               <p>Work in progress...</p>
            </div>
          )}

          {activeTab === 'simulations' && (
            <div className="animate-in fade-in duration-300">
               <h2 className="text-3xl font-bold tracking-tight text-gray-800 mb-12">
                 Simulations Section
               </h2>
               <p>Work in progress...</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}