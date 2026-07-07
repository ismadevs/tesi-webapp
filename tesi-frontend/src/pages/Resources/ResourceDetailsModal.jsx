import { X, Cpu, HardDrive, Microchip, Globe, Settings, Clock } from 'lucide-react';

export default function ResourceDetailsModal({ site, onClose }) {
  // Mappa dei colori per lo stato
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-red-500",
    maintenance: "bg-yellow-500"
  };

  // Format per la data (più leggibile)
  const formattedDate = new Date(site.lastPing).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    // BACKDROP: Sfondo scuro semitrasparente con effetto vetro sfocato (glassmorphism).
    // onClick={onClose} permette di chiudere cliccando fuori.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >

      {/* MODAL CARD: Il contenitore principale.
          onClick={(e) => e.stopPropagation()} impedisce che il click *dentro* la card chiuda la modale */}
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColors[site.status] || 'bg-gray-300'}`} />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {site.status}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-black tracking-tight">
              {site.name}
            </h2>
            <span className="text-sm font-mono text-gray-400 mt-1">ID: {site.id}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY: Griglia di riquadri in stile "Widget" di iOS */}
        <div className="p-6 space-y-6 mt-2">

          {/* Sezione Compute */}
          <div>
            <h4 className="text-sm font-semibold text-black mb-3 px-1">Compute Capacity</h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                <Cpu size={20} className="text-black mb-2" />
                <span className="text-xl font-bold text-black">{site.compute.cpuCores}</span>
                <span className="text-xs text-black font-medium mt-0.5">Cores</span>
              </div>
              <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                <Microchip size={20} className="text-black mb-2" />
                <span className="text-xl font-bold text-black">{site.compute.ramGB}</span>
                <span className="text-xs text-black font-medium mt-0.5">GB RAM</span>
              </div>
              <div className="bg-gray-50/80 p-4 rounded-2xl flex flex-col items-center justify-center text-center border border-gray-100/50">
                <HardDrive size={20} className="text-black mb-2" />
                <span className="text-xl font-bold text-black">{site.compute.storageTB}</span>
                <span className="text-xs text-black font-medium mt-0.5">TB Storage</span>
              </div>
            </div>
          </div>

          {/* Sezione Tech & Network */}
          <div>
             <h4 className="text-sm font-semibold text-black mb-3 px-1">Infrastructure</h4>
             <div className="space-y-2">
                <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                  <div className="flex items-center gap-3 text-black">
                    <Settings size={18} strokeWidth={2.5}/>
                    <span className="text-sm font-medium">Hosting & OS</span>
                  </div>
                  <span className="text-sm font-semibold text-black">
                    {site.tech.hostingType} <span className="text-black mx-1">/</span> {site.tech.os}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100/50">
                  <div className="flex items-center gap-3 text-black">
                    <Globe size={18}/>
                    <span className="text-sm font-medium">IP Address</span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-black">
                    {site.tech.ipAddress}
                  </span>
                </div>
             </div>
          </div>

          {/* Sezione Monitoraggio */}
          <div className="flex items-center gap-2 justify-center pt-2">
            <Clock size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400">
              Last signal: {formattedDate}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}