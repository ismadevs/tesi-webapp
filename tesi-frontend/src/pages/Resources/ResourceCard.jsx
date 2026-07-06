import { useState } from 'react';
import { MoreVertical, Info, Pencil, Trash2 } from 'lucide-react';

export default function ResourceCard({ site }){
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    maintenance: "bg-yellow-500"
  };

  return (
    // rounded-2xl per un look più moderno e "social"
    // shadow-sm che diventa shadow-lg con un bordo che si scurisce leggermente all'hover
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 relative flex flex-col h-full group">

      {/* ==========================================
          HEADER (Status, Nome e Kebab Menu)
          ========================================== */}
      <div className="flex justify-between items-start mb-4">

        {/* Titolo e Pallino (Spaziature ridotte per un feeling più coeso) */}
        <div className="flex items-center gap-2.5 mt-0.5">
          <div className={`w-2.5 h-2.5 rounded-full ${statusColors[site.status] || 'bg-gray-300'}`} />
          {/* tracking-tight dà quel look da brand premium */}
          <h3 className="text-lg font-bold text-black tracking-tight">
            {site.name}
          </h3>
        </div>

        {/* Kebab Menu */}
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MoreVertical size={18} strokeWidth={2.5} />
          </button>

          {/* Il Dropdown */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              <button
                onClick={() => { console.log('Edit', site.id); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
              >
                <Pencil size={14} /> Edit
              </button>
              <button
                onClick={() => { console.log('Delete', site.id); setIsMenuOpen(false); }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          BODY (Specifiche CPU/RAM)
          ========================================== */}
      {/* mb-auto spinge gli elementi successivi verso il basso */}
      <div className="mb-auto">
        <p className="text-sm font-semibold text-black">
          {site.compute.cpuCores} Cores <span className="text-black font-light mx-1.5">•</span> {site.compute.ramGB} GB RAM
        </p>
      </div>

      {/* ==========================================
          FOOTER INVISIBILE (Badge e Info)
          ========================================== */}
      {/* NESSUN BORDO. Solo spazio e allineamento perfetto. */}
      <div className="flex justify-between items-end mt-6">
        
        {/* Badge Tecnologia (Leggermente più morbido) */}
        <span className="px-2.5 py-1 bg-blue-50/80 text-primary text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wide">
          {site.tech.hostingType}
        </span>

        {/* Bottone Info (Stesso identico stile del Kebab menu) */}
        <button
          onClick={() => console.log('Apri modale info dettagliate per', site.id)}
          className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="View Full Metadata"
        >
          <Info size={18} strokeWidth={2.5} />
        </button>

      </div>

    </div>
  );
}