import { useState } from 'react';
import {
  X, Ruler, Globe, Clock, 
  KeyRound, Copy, Check, Server, Cloud, 
  Box, MapPin, LaptopMinimal
} from 'lucide-react';

export default function ResourceDetailsModal({ resource, onClose }) {
  // ==========================================
  // GESTIONE STATO LOCALE
  // ==========================================
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(resource.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Distinguiamo se è Kubernetes o VM dal Site ID
  const isBaremetal = resource.siteId && resource.siteId.includes('baremetal');

  const handleCopyKey = () => {
    if (resource.sshKey) {
      navigator.clipboard.writeText(resource.sshKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    // BACKDROP
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* CONTENITORE: max-w-2xl offre già moltissimo spazio */}
      <div
        className="bg-white rounded-4xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==========================================
            HEADER: Allineamento orizzontale pulito
            ========================================== */}
        <div className="px-8 pt-8 pb-6 relative border-b border-gray-100">
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>

          <div className="flex flex-col gap-3 pr-12">
            {/* Riga 1: Pallino di stato + Nome */}
            <div className="flex items-center gap-3">
              {resource.status === 'starting' ? (
                <span className="relative flex h-4 w-4 shrink-0">
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-blue-500 shrink-0"></span>
                </span>
              ) : (
                <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 shrink-0"></span>
              )}
              <h2 className="text-3xl font-extrabold text-black tracking-tight truncate">
                {resource.name}
              </h2>
            </div>
            
            {/* Riga 2: Badge (Kubernetes / Slices VM) + Testo Stato */}
            <div className="flex items-center gap-3 ml-1">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border text-[11px] font-extrabold tracking-widest uppercase ${
                isBaremetal 
                  ? 'bg-white border-gray-200 text-black' 
                  : 'bg-white border-gray-200 text-black'
              }`}>
                {isBaremetal ? 'Kubernetes' : 'Slices VM'}
              </div>

              <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                {resource.status}
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================
            CORPO: Griglia a 2 colonne per i dettagli
            ========================================== */}
        <div className="p-8 space-y-6">
          
          {/* Layout a griglia per sfruttare la larghezza */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* COLONNA 1 */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-3 text-black shrink-0">
                  <Box size={18} strokeWidth={2.5} />
                  <span className="text-sm font-semibold">Experiment ID</span>
                </div>
                <span className="text-sm font-bold text-black text-right">{resource.experiment}</span>
              </div>

              {/* Rimosso truncate e max-w per mostrare il Site ID per intero */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-3 text-black shrink-0">
                  <MapPin size={18} strokeWidth={2.5} />
                  <span className="text-sm font-semibold">Site ID</span>
                </div>
                <span className="text-sm font-bold text-black text-right wrap-break-words">
                  {resource.siteId}
                </span>
              </div>

              {/* Rimosso truncate e max-w anche dal Flavor per evitare problemi futuri */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-3 text-black shrink-0">
                  <Ruler size={18} strokeWidth={2.5} />
                  <span className="text-sm font-semibold">Flavor</span>
                </div>
                <span className="text-sm font-bold text-black text-right wrap-break-words">
                  {resource.flavor}
                </span>
              </div>
            </div>

            {/* COLONNA 2 */}
            <div className="flex flex-col gap-4">
              {/* Rimosso truncate e max-w dall'OS Image */}
              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-3 text-black shrink-0">
                  <LaptopMinimal size={18} strokeWidth={2.5} />
                  <span className="text-sm font-semibold">OS Image</span>
                </div>
                <span className="text-sm font-bold text-black text-right wrap-break-words">
                  {resource.diskImage}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-3 text-black shrink-0">
                  <Clock size={18} strokeWidth={2.5} />
                  <span className="text-sm font-semibold">Lifetime</span>
                </div>
                <span className="text-sm font-bold text-black text-right">{resource.duration}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl gap-4">
                <div className="flex items-center gap-3 text-black shrink-0">
                  <Globe size={18} strokeWidth={2} />
                  <span className="text-sm font-semibold">Public IPv4</span>
                </div>
                <span className="text-sm font-bold text-black text-right">
                  {resource.publicIpv4 ? 'Requested' : 'None'}
                </span>
              </div>
            </div>

          </div>

          {/* RIGA INTERA: Chiave SSH in basso (occupa tutto lo spazio) */}
          <div className="flex items-center justify-between p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
            <div className="flex items-center gap-3 text-black shrink-0">
              <KeyRound size={18} strokeWidth={2.5} />
              <span className="text-sm font-semibold">SSH Key</span>
            </div>
            
            {resource.sshKey ? (
              <div className="flex items-center gap-3 max-w-[75%]">
                <span className="text-sm font-mono font-bold text-black truncate" title={resource.sshKey}>
                  {resource.sshKey}
                </span>
                <button
                  onClick={handleCopyKey}
                  className="cursor-pointer p-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0 shadow-sm"
                  title="Copy full key"
                >
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-gray-600" />}
                </button>
              </div>
            ) : (
              <span className="text-sm font-bold text-gray-400">Not provided</span>
            )}
          </div>

          {/* ==========================================
              FOOTER: Data Creazione
              ========================================== */}
          <div className="flex justify-center pt-2">
            <span className="text-sm font-medium text-gray-400">
              Allocated on {formattedDate}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}