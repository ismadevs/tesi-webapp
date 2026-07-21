import { useState, useEffect } from 'react';
import { X, CloudDownload, AlertCircle, ShipWheel, ChevronDown } from 'lucide-react';

// ==========================================
// DATI DI CONFIGURAZIONE (DAI SITI SLICES)
// ==========================================
const siteData = {
  vm: {
    siteId: 'be-gent1-bi-vm1',
    images: [
      'Debian 12.5', 'Debian 12.7', 'Debian 13.0', 'Debian 13.1', 'Debian 13.5',
      'Ubuntu 22.04.5', 'Ubuntu 24.04.1', 'Ubuntu 24.04.3', 'Ubuntu 24.04.4', 'Ubuntu 26.04'
    ],
    flavors: [
      { value: 'tiny', label: 'tiny (1 vCPU, 1 GiB RAM, 10 GB Disk)' },
      { value: 'm1.small', label: 'm1.small (1 vCPU, 2 GiB RAM, 20 GB Disk)' },
      { value: 'small', label: 'small (2 vCPU, 4 GiB RAM, 50 GB Disk)' },
      { value: 'medium', label: 'medium (4 vCPU, 8 GiB RAM, 75 GB Disk)' },
      { value: 'bdt-vm', label: 'bdt-vm (4 vCPU, 16 GiB RAM, 100 GB Disk)' },
      { value: 'large', label: 'large (4 vCPU, 16 GiB RAM, 100 GB Disk)' },
      { value: 'xlarge', label: 'xlarge (8 vCPU, 32 GiB RAM, 200 GB Disk)' }
    ]
  },
  baremetal: {
    siteId: 'be-gent1-bi-baremetal1',
    images: ['Ubuntu 22.04.5', 'Ubuntu 24.04.1', 'Ubuntu 24.04.3'],
    flavors: [
      { value: 'pc', label: 'pc (PC Baremetal generico)' },
      { value: 'pcgen05-gpu5090', label: 'pcgen05-gpu5090 (Include GPU GTX 5090)' },
      { value: 'pcgen07', label: 'pcgen07 (6 CPUs, 64 GiB RAM)' },
      { value: 'pcgen07-gpu1080', label: 'pcgen07-gpu1080 (Include GPU GTX 1080)' },
      { value: 'pcgen07-gpu980', label: 'pcgen07-gpu980 (Include GPU GTX 980)' },
      { value: 'pcgen08', label: 'pcgen08 (16 CPUs, 500 GiB RAM, GPU RTX PRO 4500)' },
      { value: 'pcgen08-gpu4500', label: 'pcgen08-gpu4500 (Include GPU RTX PRO 4500)' },
      { value: 'pcgen08-gpu5080', label: 'pcgen08-gpu5080 (Include GPU RTX PRO 5080)' },
      { value: 'pcgen08-gpu5090', label: 'pcgen08-gpu5090 (Include GPU RTX PRO 5090)' },
      { value: 'pcgen08-gpu6000', label: 'pcgen08-gpu6000 (Include GPU RTX PRO 6000)' }
    ]
  }
};

export default function AddResourceModal({ onClose, onSave, existingResources = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  // ==========================================
  // STATI DEL FORM
  // ==========================================
  const [resourceType, setResourceType] = useState(null); // 'vm' o 'baremetal'
  
  const [name, setName] = useState('');
  const [experiment, setExperiment] = useState('');
  const [diskImage, setDiskImage] = useState('');
  const [flavor, setFlavor] = useState('');
  
  // STATI PER LA LIFETIME PERSONALIZZATA
  const [durationValue, setDurationValue] = useState(3);
  const [durationUnit, setDurationUnit] = useState('h'); // 'h' per ore, 'd' per giorni

  const [publicIpv4, setPublicIpv4] = useState(false);
  const [sshKey, setSshKey] = useState('');

  // Auto-chiusura dell'errore
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Quando l'utente cambia tipo di risorsa, resettiamo immagine e flavor
  // prendendo i primi valori disponibili per quel nuovo tipo.
  useEffect(() => {
    if (resourceType) {
      setDiskImage(siteData[resourceType].images[0]);
      setFlavor(siteData[resourceType].flavors[0].value);
    }
  }, [resourceType]);

  const handleNext = () => {
    if (currentStep === 1 && resourceType) {
      setError('');
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(1);
  };

  const handleSubmit = () => {
    setError('');

    // Validazioni
    if (!name.trim()) return setError('Resource Name cannot be empty.');
    
    // Controllo caratteri validi per il nome (stile hostname)
    const nameRegex = /^[a-zA-Z0-9\s\-]+$/;
    if (!nameRegex.test(name)) return setError('Name can only contain letters, numbers, spaces, and dashes.');
    
    if (!experiment.trim()) return setError('Experiment ID/Name is required.');

    // Evitiamo doppioni di nomi per evitare conflitti
    const isDuplicate = existingResources.some(res => res.name.toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) return setError('A resource with this name already exists.');

    // ------------------------------------------
    // VALIDAZIONE LIFETIME (Da 3 a 2160 ore, 1 a 90 giorni)
    // ------------------------------------------
    const durNum = Number(durationValue);
    if (durationUnit === 'h') {
      if (durNum < 3 || durNum > 2160) return setError('Duration in hours must be between 3 and 2160.');
    } else if (durationUnit === 'd') {
      if (durNum < 1 || durNum > 90) return setError('Duration in days must be between 1 and 90.');
    }

    // Costruzione del payload da inviare al backend
    const newResourceData = {
      name: name.trim(),
      experiment: experiment.trim(),
      siteId: siteData[resourceType].siteId,
      diskImage: diskImage,
      flavor: flavor,
      duration: `${durNum}${durationUnit}`,
      count: 1, // Di default ne creiamo una per ora
      publicIpv4: publicIpv4,
      sshKey: sshKey.trim() || null
    };

    onSave(newResourceData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-4xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="shrink-0">
          <div className="flex items-center justify-between p-8 pb-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Step {currentStep} of 2
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {currentStep === 1 ? 'Choose Infrastructure' : 'Configure Metadata'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1 bg-gray-100">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        {/* BODY */}
        <div className="p-8 flex-1 overflow-y-auto no-scrollbar relative">
          
          {/* Messaggio di errore fisso in alto */}
          {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
               <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
               <p className="text-red-700 text-sm font-medium">{error}</p>
             </div>
          )}

          {/* STEP 1: Selezione Site ID */}
          {currentStep === 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 h-full min-h-62.5">
              {/* Opzione VM */}
              <div 
                onClick={() => setResourceType('vm')}
                className={`w-full sm:w-56 h-56 rounded-3xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  resourceType === 'vm' 
                  ? 'border-blue-600 bg-white shadow-md scale-[1.02] border-3' 
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <CloudDownload size={48} className={`mb-4 ${resourceType === 'vm' ? 'text-blue-600' : 'text-black'}`} strokeWidth={1.5} />
                <h3 className={`font-extrabold text-lg ${resourceType === 'vm' ? 'text-blue-700' : 'text-black'}`}>Virtual Machine</h3>
              </div>

              {/* Opzione Baremetal */}
              <div 
                onClick={() => setResourceType('baremetal')}
                className={`w-full sm:w-56 h-56 rounded-3xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                  resourceType === 'baremetal' 
                  ? 'border-blue-600 bg-white shadow-md scale-[1.02] border-3' 
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                }`}
              >
                <ShipWheel size={48} className={`mb-4 ${resourceType === 'baremetal' ? 'text-blue-600' : 'text-black'}`} strokeWidth={1.5} />
                <h3 className={`font-extrabold text-lg ${resourceType === 'baremetal' ? 'text-blue-700' : 'text-black'}`}>Kubernetes</h3>
              </div>
            </div>
          )}

          {/* STEP 2: Configurazione Dettagli */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              
              {/* Sezione Base: Nome ed Esperimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Resource Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. backend-node-01"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Experiment ID / Name</label>
                  <input
                    type="text"
                    value={experiment}
                    onChange={(e) => setExperiment(e.target.value)}
                    placeholder="e.g. 101"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Sezione Sistema: OS, Flavor e Durata con Griglia 12-colonne per dare più spazio al Flavor */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* OS Image (4 colonne su 12) */}
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">OS Image</label>
                  <div className="relative">
                    <select 
                      value={diskImage} 
                      onChange={(e) => setDiskImage(e.target.value)} 
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none truncate"
                    >
                      {siteData[resourceType].images.map(img => <option key={img} value={img}>{img}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Flavor (5 colonne su 12) */}
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Hardware Flavor</label>
                  <div className="relative">
                    <select 
                      value={flavor} 
                      onChange={(e) => setFlavor(e.target.value)} 
                      className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer appearance-none truncate"
                    >
                      {siteData[resourceType].flavors.map(flv => <option key={flv.value} value={flv.value}>{flv.label}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                  </div>
                </div>

                {/* Lifetime (3 colonne su 12) */}
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2" title="Min 3h, Max 90d">
                    Lifetime Limit
                  </label>
                  <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    <input 
                      type="number" 
                      min="1"
                      value={durationValue} 
                      onChange={(e) => setDurationValue(e.target.value)} 
                      className="w-full pl-3 pr-2 py-3 bg-transparent text-sm font-semibold text-gray-900 focus:outline-none text-center appearance-none"
                    />
                    <div className="relative flex items-center border-l border-gray-200 bg-transparent w-21.25 shrink-0">
                      <select 
                        value={durationUnit} 
                        onChange={(e) => setDurationUnit(e.target.value)} 
                        className="w-full h-full pl-3 pr-8 py-3 bg-transparent text-sm font-bold text-gray-600 focus:outline-none cursor-pointer appearance-none"
                      >
                        <option value="h">Hours</option>
                        <option value="d">Days</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>
                  </div>
                </div>

              </div>

              <hr className="border-gray-100" />

              {/* Sezione Sicurezza: Chiave SSH e IP Pubblico */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    SSH Public Key <span className="text-gray-400 font-medium normal-case tracking-normal ml-1">(Optional)</span>
                  </label>
                  <textarea
                    value={sshKey}
                    onChange={(e) => setSshKey(e.target.value)}
                    placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI..."
                    rows={2}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
                
                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={publicIpv4}
                      onChange={(e) => setPublicIpv4(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors ${publicIpv4 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${publicIpv4 ? 'transform translate-x-5' : ''}`}></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">Request Public IPv4</span>
                </label>
              </div>

            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-100 bg-white shrink-0">
          <button 
            type="button" 
            onClick={currentStep === 1 ? onClose : handleBack} 
            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep === 1 ? (
            <button 
              type="button" 
              onClick={handleNext}
              disabled={!resourceType}
              className={`px-8 py-2.5 text-sm font-bold rounded-xl transition-all ${
                resourceType 
                  ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer shadow-sm' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              className="px-8 py-2.5 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
            >
              Allocate Resource
            </button>
          )}
        </div>

      </div>
    </div>
  );
}