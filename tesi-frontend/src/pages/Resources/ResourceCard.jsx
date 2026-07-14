import { useState } from 'react';
import { MoreVertical, Info, Pencil, Trash2 } from 'lucide-react';

export default function ResourceCard({ site, onOpenInfo, onDeleteSite, onEditSite }){
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ==========================================
  // MAPPA DEI COLORI STATO (AGGIORNATA)
  // ==========================================
  // Abbiamo aggiunto 'in-use' (blu, come hai chiesto)
  // e 'creating' (un azzurro che pulsa per dare il senso di caricamento)
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    maintenance: "bg-yellow-500",
    "in-use": "bg-blue-500"
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 relative flex flex-col h-full group">

      {/* ==========================================
          HEADER (Status, Nome e Kebab Menu)
          ========================================== */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2.5 mt-0.5">
          <div
            className={`w-2.5 h-2.5 rounded-full ${statusColors[site.status] || "bg-gray-300"}`}
          />
          <h3 className="text-lg font-bold text-black tracking-tight">
            {site.name}
          </h3>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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
                    onEditSite(site);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm font-medium text-black hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                >
                  <Pencil size={14} /> Edit
                </button>
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
          BODY DINAMICO (VM vs KUBERNETES)
          ========================================== */}
      <div className="mb-auto mt-2">
        {/* Usiamo un IF ternario in base al resourceType */}
        {site.resourceType === 'slices-vm' ? (
          // VISUALIZZAZIONE PER LE MACCHINE VIRTUALI
          <p className="text-sm font-semibold text-black">
            {site.spec.cpuCores} Cores{" "}
            <span className="text-black font-light mx-1.5">•</span>{" "}
            {site.spec.ramGB} GB RAM
            <span className="text-black font-light mx-1.5">•</span>{" "}
            {site.spec.storageTB} TB SSD
          </p>
        ) : (
          // VISUALIZZAZIONE PER I CLUSTER KUBERNETES
          <p className="text-sm font-semibold text-black">
            {site.spec.workerNodes} Nodes
            <span className="text-black font-light mx-1.5">•</span>{" "}
            {/* .split(' ')[0] prende "Large (8 Cores...)" e mostra solo "Large" */}
            {site.spec.nodeFlavor?.split(' ')[0] || "Unknown"}
            <span className="text-black font-light mx-1.5">•</span>{" "}
            {site.spec.k8sVersion}{" "}
          </p>
        )}
      </div>

      {/* ==========================================
          FOOTER (Badge Tecnologia e Tasto Info)
          ========================================== */}
      <div className="flex justify-between items-end mt-6">

        {/* BADGE DINAMICO TIPO RISORSA */}
        <span className="px-2.5 py-1 bg-white text-black text-xs font-bold rounded-lg border border-gray-200 tracking-wide">
          {site.resourceType === 'slices-vm' ? 'Slices VM' : 'Kubernetes Cluster'}
        </span>

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