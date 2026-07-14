import { useState } from 'react';
import {
  X, Cpu, HardDrive, Microchip, Globe,
  Settings, Clock, FileClock, Box, KeyRound, Copy, Check, Network
} from 'lucide-react';

export default function ResourceDetailsModal({ site, onClose }){
  // ==========================================
  // GESTIONE STATO LOCALE
  // ==========================================
  // Gestisce il feedback visivo (l'icona che cambia) quando l'utente copia la chiave
  const [copied, setCopied] = useState(false);

  // Mappa dei colori pulita a soli 4 stati reali
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    maintenance: "bg-yellow-500",
    "in-use": "bg-blue-500"
  };

  // Formattiamo la data di creazione in un formato leggibile e internazionale
  const formattedDate = new Date(site.createdAt).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  // Variabile "helper" per capire al volo se stiamo disegnando i dettagli di una VM
  const isVM = site.resourceType === 'slices-vm';

  // Funzione attivata dal click sull'icona Copy.
  // Scrive la stringa negli appunti di sistema e mostra la spunta verde per 2 secondi.
  const handleCopyKey = () => {
    if (site.connection?.accessKey) {
      navigator.clipboard.writeText(site.connection.accessKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    // BACKDROP: Lo sfondo sfocato scuro. Cliccando qui la modale si chiude.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* CONTENITORE MODALE: e.stopPropagation() impedisce ai click interni di chiuderla */}
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==========================================
            HEADER MODALE
            ========================================== */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex flex-col gap-1">
            
            {/* Pallino di stato e label testuale */}
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColors[site.status] || 'bg-gray-300'}`} />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {site.status}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold text-black tracking-tight">
              {site.name}
            </h2>
            
            {/* Badge dinamico e ID */}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-bold rounded uppercase tracking-wide">
                {isVM ? 'Slices VM' : 'Kubernetes Cluster'}
              </span>
              <span className="text-sm font-mono text-gray-400">ID: {site.id}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* ==========================================
            CORPO DELLA MODALE
            ========================================== */}
        <div className="p-6 space-y-6 mt-2">

          {/* === SEZIONE 1: SPECIFICHE (RENDER CONDIZIONALE) === */}
          <div>
            <h4 className="text-sm font-semibold text-black mb-3 px-1">
              {isVM ? 'Compute Capacity' : 'Cluster Configuration'}
            </h4>

            {isVM ? (
              // WIDGET HARDWARE: Visualizzato SOLO per le Slices VM
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                  <Cpu size={20} className="text-black mb-2" />
                  <span className="text-xl font-bold text-black">{site.spec.cpuCores}</span>
                  <span className="text-xs text-black font-medium mt-0.5">Cores</span>
                </div>
                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                  <Microchip size={20} className="text-black mb-2" />
                  <span className="text-xl font-bold text-black">{site.spec.ramGB}</span>
                  <span className="text-xs text-black font-medium mt-0.5">GB RAM</span>
                </div>
                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                  <HardDrive size={20} className="text-black mb-2" />
                  <span className="text-xl font-bold text-black">{site.spec.storageTB}</span>
                  <span className="text-xs text-black font-medium mt-0.5">TB Storage</span>
                </div>
              </div>
            ) : (
              // WIDGET KUBERNETES: Visualizzato SOLO per i Cluster
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                  <Network size={20} className="text-black mb-2" />
                  <span className="text-xl font-bold text-black">{site.spec.workerNodes}</span>
                  <span className="text-xs text-black font-medium mt-0.5">Nodes</span>
                </div>
                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                  <Box size={20} className="text-black mb-2" />
                  {/* Estraiamo solo la parola "Large/Medium" ignorando i dettagli testuali */}
                  <span className="text-sm font-bold text-black mt-1 leading-tight break-all">
                    {site.spec.nodeFlavor?.split(' ')[0] || "Unknown"}
                  </span>
                  <span className="text-xs text-black font-medium mt-0.5">Flavor</span>
                </div>
                <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                  <FileClock size={20} className="text-black mb-2" />
                  <span className="text-sm font-bold text-black mt-1">{site.spec.k8sVersion}</span>
                  <span className="text-xs text-black font-medium mt-0.5">Version</span>
                </div>
              </div>
            )}
          </div>

          {/* === SEZIONE 2: RETE E ACCESSO (IN PARTE COMUNE) === */}
          <div>
             <h4 className="text-sm font-semibold text-black mb-3 px-1">Access & Network</h4>
             <div className="space-y-2">

                {/* Il Sistema Operativo viene renderizzato solo se è una VM */}
                {isVM && (
                  <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                    <div className="flex items-center gap-3 text-black">
                      <Settings size={18} strokeWidth={2.5}/>
                      <span className="text-sm font-medium">Operating System</span>
                    </div>
                    <span className="text-sm font-semibold text-black">
                      {site.spec.os}
                    </span>
                  </div>
                )}

                {/* Indirizzo IP */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                  <div className="flex items-center gap-3 text-black">
                    <Globe size={18}/>
                    <span className="text-sm font-medium">IP Address</span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-black">
                    {site.connection?.ipAddress || <span className="text-gray-400">Not assigned</span>}
                  </span>
                </div>

                {/* SPAZIO CHIAVE UNIFICATO: Uguale per VM e Kubernetes */}
                <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                  <div className="flex items-center gap-3 text-black">
                    <KeyRound size={18} strokeWidth={2.5}/>
                    <span className="text-sm font-medium">Access Key</span>
                  </div>

                  {/* Se la chiave esiste, mostriamo il testo in chiaro e il pulsante copia */}
                  {site.connection?.accessKey ? (
                    <div className="flex items-center gap-2 max-w-[60%]">
                      {/* break-all permette alla chiave di andare a capo senza sbavare fuori dalla card */}
                      <span className="text-sm font-mono font-semibold text-black break-all">
                        {site.connection.accessKey}
                      </span>
                      <button
                        onClick={handleCopyKey}
                        className="cursor-pointer p-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 text-gray-600 transition-colors shrink-0"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  ) : (
                    // Se la chiave è null (es. la risorsa è appena stata creata o offline)
                    <span className="text-sm font-mono font-semibold text-gray-400">
                      Not available
                    </span>
                  )}
                </div>

             </div>
          </div>

          {/* === FOOTER: TIMESTAMP === */}
          <div className="flex items-center gap-2 justify-center pt-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400">
              Created on: {formattedDate}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}