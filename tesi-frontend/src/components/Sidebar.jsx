import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Boxes, DatabasePlus, CloudUpload } from 'lucide-react';

export default function Sidebar(){
  // useLocation è un hook di react-router-dom che ci restituisce un oggetto con le informazioni sull'URL attuale.
  const location = useLocation();

  // Estraiamo 'pathname' (es. "/home" o "/resources") per sapere esattamente su quale pagina si trova l'utente.
  const currentPath = location.pathname;

  // ==========================================
  // DEFINIZIONE DELLE VOCI DI MENU
  // ==========================================
  // Le voci sono definite in un array invece che scritte una per una nel JSX.
  // In questo modo l'ordine della sidebar si cambia riordinando l'array, e aggiungere
  // una sezione richiede una riga sola. L'ordine riflette il flusso di lavoro della
  // piattaforma: si compone un esperimento, vi si aggiungono risorse, si materializza
  // il tutto su SLICES-RI.
  const navItems = [
    { path: '/home',        label: 'Home',        Icon: LayoutDashboard },
    { path: '/experiments', label: 'Experiments', Icon: Boxes },
    { path: '/resources',   label: 'Resources',   Icon: DatabasePlus },
    { path: '/deploy',      label: 'Deploy',      Icon: CloudUpload },
  ];

  // Questa funzione calcola le classi CSS (Tailwind) da applicare a ciascun bottone del menu.
  // Riceve in input il 'path' (la destinazione) del bottone che stiamo renderizzando in quel momento.
  const getSidebarItemStyle = (path) => {
    // baseStyle: classi comuni a tutti i bottoni
    // (layout flex, allineamento orizzontale, transizione fluida dei colori, w-full per occupare tutto lo spazio).
    const baseStyle = "group flex items-center gap-4 text-xl transition-colors cursor-pointer w-full";

    // Se l'URL attuale inizia con la destinazione del bottone, restituiamo lo stile di base
    // unito allo stile "attivo" (grassetto e colore primario).
    if (currentPath.startsWith(path)) {
      return `${baseStyle} font-bold text-primary`;
    }

    // Altrimenti lo stile "inattivo": testo nero semi-grassetto, che diventa blu e grassetto
    // solo quando l'utente ci passa sopra col mouse tramite gli 'hover:'.
    return `${baseStyle} font-semibold text-black hover:text-primary hover:font-bold`;
  };

  return (
    // <aside>: tag HTML semantico specifico per le barre laterali.
    // w-80 (larghezza fissa), h-screen (altezza 100% della finestra),
    // sticky top-0 (rimane incollata in alto se si scorre il contenuto principale), py-12 (spaziatura verticale).
    <aside className="w-80 h-screen sticky top-0 py-12">

      {/* Contenitore interno: occupa tutta l'altezza disponibile (h-full),
          disegna un bordo grigio solo a destra (border-r) e centra il menu verticalmente (justify-center). */}
      <div className="h-full border-r border-gray-200 flex flex-col justify-center">

        {/* <nav>: tag HTML semantico per racchiudere i link di navigazione.
            gap-10 distanzia i link tra loro, pl-18 li spinge verso destra staccandoli dal bordo sinistro. */}
        <nav className="flex flex-col gap-10 pl-18">

          {/* Cicliamo sull'array delle voci di menu.
              Utilizziamo il componente <Link> invece del classico tag HTML <a>: questo permette a React
              di cambiare l'URL e l'interfaccia istantaneamente senza far ricaricare la pagina al browser. */}
          {navItems.map(({ path, label, Icon }) => (
            <Link key={path} to={path} className={getSidebarItemStyle(path)}>
              <Icon strokeWidth={2} size={26} />
              <span>{label}</span>
            </Link>
          ))}

        </nav>
      </div>
    </aside>
  );
}