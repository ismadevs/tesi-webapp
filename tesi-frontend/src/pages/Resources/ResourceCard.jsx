import { useState } from 'react';
import { MoreVertical, Info, Pencil, Trash2, LaptopMinimal, Ruler, Clock } from 'lucide-react';

export default function ResourceCard({ resource, onOpenInfo, onDeleteResource, onEditResource }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ==========================================
  // LOGICA DI PRESENTAZIONE
  // ==========================================
  // Riconosciamo il tipo di risorsa dal Site ID per assegnare il nome corretto
  const isBaremetal = resource.siteId && resource.siteId.includes('baremetal');

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 relative flex flex-col h-full group">

      {/* ==========================================
          HEADER (Status, Nome e Kebab Menu)
          ========================================== */}
      <div className="flex justify-between items-start mb-4">
        
        <div className="flex items-center gap-3">
          {/* INDICATORE DI STATO */}
          {resource.status === 'starting' ? (
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shrink-0"></span>
            </span>
          ) : (
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shrink-0"></span>
          )}

          <h3 className="text-lg font-bold text-black tracking-tight line-clamp-1" title={resource.name}>
            {resource.name}
          </h3>
        </div>

        {/* MENU A TENDINA (Modifica / Elimina) */}
        <div className="relative shrink-0 mt-1.5">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 -mt-1.5 -mr-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MoreVertical size={18} strokeWidth={2.5} />
          </button>

          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-36 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
                <button
                  onClick={() => {
                    onEditResource(resource);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => {
                    onDeleteResource(resource);
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
          BODY: METADATI ESSENZIALI (Sotto al nome)
          ========================================== */}
      <div className="mb-auto flex flex-col gap-3">
        <p className="text-sm font-semibold text-black flex items-center gap-2.5">
          <Ruler size={16} strokeWidth={2.5} className="text-black shrink-0" />
          <span>Flavor:</span>
          {resource.flavor}
        </p>
        <p className="text-sm font-semibold text-black flex items-center gap-2.5">
          <Clock size={16} strokeWidth={2.5} className="text-black shrink-0" />
          <span>Lifetime:</span>
          {resource.duration}
        </p>
      </div>

      {/* ==========================================
          FOOTER: Badge Visivo e Tasto Info (Senza Divider)
          ========================================== */}
      <div className="flex justify-between items-end mt-5">
        
        {/* BADGE TIPO RISORSA (Senza icone) */}
        <div className={`px-2.5 py-1 rounded-md border text-[11px] font-bold tracking-wide uppercase ${
          isBaremetal 
            ? 'bg-white border-gray-200 text-black' 
            : 'bg-white border-gray-200 text-black'
        }`}>
          {isBaremetal ? 'Kubernetes' : 'Slices VM'}
        </div>

        {/* TASTO INFO */}
        <button
          onClick={() => onOpenInfo(resource)}
          className="p-1.5 -mb-0.5 -mr-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
          title="View Full Metadata"
        >
          <Info size={18} strokeWidth={2.5} />
        </button>
      </div>

    </div>
  );
}