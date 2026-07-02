import { useState } from 'react';
import { Cpu, MoreVertical, Info, Pencil, Trash2 } from 'lucide-react';

// Il componente accetta una prop chiamata "site", che sarà il nostro oggetto mock con tutti i dati.
export default function ResourceCard({ site }){
  // Stato locale per gestire l'apertura/chiusura del menu a tendina (Kebab menu)
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Una piccola mappa per assegnare automaticamente il colore del pallino in base allo stato
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    maintenance: "bg-yellow-500"
  };

  return (
    // relative: fondamentale perché il menu a tendina sarà posizionato in modo "absolute" rispetto a questa card.
    // h-full e flex-col: ci assicurano che se le card sono affiancate, saranno tutte alte uguali e il footer andrà sempre in fondo.
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative flex flex-col h-full">

      {/* ==========================================
          HEADER (Status, Nome e Kebab Menu)
          ========================================== */}
      <div className="flex justify-between items-start mb-6">

        {/* Titolo e Pallino */}
        <div className="flex items-center gap-3 mt-1">
          {/* Pallino pulsante. Usa la mappa dei colori o un grigio di default se lo stato non è riconosciuto */}
          <div className={`w-3 h-3 rounded-full shadow-sm ${statusColors[site.status] || 'bg-gray-300'}`} />
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            {site.name}
          </h3>
        </div>

        {/* Kebab Menu (3 puntini) */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 text-gray-400 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MoreVertical size={20} />
          </button>

          {/* Il Dropdown che appare solo se isMenuOpen è true */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
              <button
                onClick={() => { console.log('Edit', site.id); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => { console.log('Delete', site.id); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          BODY (Specifiche tecniche essenziali)
          ========================================== */}
      {/* mb-auto spinge il footer verso il basso riempiendo lo spazio vuoto */}
      <div className="space-y-4 mb-auto">

        {/* Riga CPU & RAM */}
        <div className="flex items-center gap-3 text-gray-700">
          <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
            <Cpu size={18} className="text-gray-500" />
          </div>
          <span className="text-sm font-semibold">
            {site.compute.cpuCores} Cores <span className="text-gray-300 mx-1">•</span> {site.compute.ramGB} GB RAM
          </span>
        </div>

        {/* Badge Tecnologia Hosting */}
        <div className="flex">
          <span className="px-3 py-1 bg-blue-50 text-primary text-xs font-bold rounded-md border border-blue-100 uppercase tracking-wider">
            {site.tech.hostingType}
          </span>
        </div>
      </div>

      {/* ==========================================
          FOOTER (IP e Bottone Info)
          ========================================== */}
      <div className="flex justify-between items-center border-t border-gray-100 pt-4 mt-6">
        <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded">
          {site.tech.ipAddress}
        </span>

        <button
          onClick={() => console.log('Apri modale info dettagliate per', site.id)}
          className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-full transition-colors cursor-pointer title-tooltip"
          title="View Full Metadata"
        >
          <Info size={20} strokeWidth={2.5} />
        </button>
      </div>

    </div>
  );
}