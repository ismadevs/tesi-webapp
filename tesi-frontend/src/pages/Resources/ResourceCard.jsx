import { useState } from 'react';
import { MoreVertical, Info, Pencil, Trash2 } from 'lucide-react';

// Il componente accetta 'site' (i dati), 'onOpenInfo' (la funzione passata da ResourcesPage) e 'onDeleteSite' (per gestire l'eliminazione)
export default function ResourceCard({ site, onOpenInfo, onDeleteSite }){ // <-- Aggiunta prop onDeleteSite
  // Stato per il menu a tendina (Kebab menu)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mappa dei colori per il pallino di stato
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    maintenance: "bg-yellow-500"
  };

  return (
    // CARD CONTAINER: 
    // rounded-2xl (squircle) e transizioni morbide sulle ombre per un feeling "premium/Tesla".
    // relative: fondamentale per far posizionare il dropdown del kebab menu in modo corretto.
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 relative flex flex-col h-full group">

      {/* ==========================================
          HEADER (Status, Nome e Kebab Menu)
          ========================================== */}
      <div className="flex justify-between items-start mb-4">

        {/* Titolo e Pallino */}
        <div className="flex items-center gap-2.5 mt-0.5">
          {/* Pallino colorato in base allo stato, piccolino (w-2.5) per il minimalismo */}
          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[site.status] || 'bg-gray-300'}`} />
          {/* tracking-tight stringe leggermente le lettere del titolo */}
          <h3 className="text-lg font-bold text-black tracking-tight">
            {site.name}
          </h3>
        </div>

        {/* Kebab Menu (Opzioni Edit/Delete) */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MoreVertical size={18} strokeWidth={2.5} />
          </button>

          {/* Il Dropdown che si apre al click con patch per la chiusura cliccando fuori */}
          {isMenuOpen && (
            <>
              {/* BACKDROP INVISIBILE: Copre l'intero schermo sotto al dropdown. 
                  Cliccando in un punto qualsiasi fuori dal menu, questo div intercetta il click e lo chiude. */}
              <div 
                className="fixed inset-0 z-10 cursor-default" 
                onClick={() => setIsMenuOpen(false)} 
              />

              {/* IL DROPDOWN VERO E PROPRIO (z-20 per stare sopra al backdrop) */}
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                <button
                  onClick={() => { console.log('Edit', site.id); setIsMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Pencil size={14} /> Edit
                </button>
                {/* TASTO DELETE: Attiva la chiamata sul backend passando l'ID specifico */}
                <button
                  onClick={() => { 
                    onDeleteSite(site); 
                    setIsMenuOpen(false); 
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ==========================================
          BODY (Specifiche CPU/RAM)
          ========================================== */}
      {/* mb-auto funge da molla: spinge tutto il blocco successivo verso il basso */}
      <div className="mb-auto">
        <p className="text-sm font-semibold text-black">
          {site.compute.cpuCores} Cores <span className="text-black font-light mx-1.5">•</span> {site.compute.ramGB} GB RAM
        </p>
      </div>

      {/* ==========================================
          FOOTER (Badge Tecnologia e Tasto Info)
          ========================================== */}
      <div className="flex justify-between items-end mt-6">
        
        {/* Badge Hosting Type (Es. Docker, Kubernetes) */}
        <span className="px-2.5 py-1 bg-blue-50/80 text-primary text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wide">
          {site.tech.hostingType}
        </span>

        {/* BOTTONE INFO - FIXATO! */}
        {/* Ora c'è solo un onClick che chiama la funzione passando i dati del sito alla modale */}
        <button
          onClick={() => onOpenInfo(site)} 
          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="View Full Metadata"
        >
          <Info size={18} strokeWidth={2.5} />
        </button>

      </div>

    </div>
  );
}