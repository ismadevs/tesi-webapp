import { useState, useEffect } from 'react';
import { X, MonitorStop, ShipWheel } from 'lucide-react';

export default function AddSiteModal({ onClose, onSave, existingSites = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [resourceType, setResourceType] = useState(null);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [status, setStatus] = useState('online');

  const [cpuCores, setCpuCores] = useState(4);
  const [ramGB, setRamGB] = useState(8);
  const [storageTB, setStorageTB] = useState(1);
  const [os, setOs] = useState('Ubuntu');

  const [k8sVersion, setK8sVersion] = useState('v1.28.0');
  const [workerNodes, setWorkerNodes] = useState(3);
  const [nodeFlavor, setNodeFlavor] = useState('Medium (4 Cores, 8GB RAM)');

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  const osOptions = ['Ubuntu', 'Debian', 'Rocky Linux', 'AlmaLinux', 'RHEL', 'Windows Server'];
  const coresOptions = [1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160, 192];
  const ramOptions = [1, 2, 4, 8, 16, 32, 64, 96, 128, 192, 256, 384, 512, 768, 1024, 1536, 2048, 3072];
  const storageOptions = [0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 20, 24, 28, 32];
  
  const versionOptions = ['v1.27.3', 'v1.28.0', 'v1.29.0'];
  const flavorOptions = [
    'Small (2 Cores, 4GB RAM)', 
    'Medium (4 Cores, 8GB RAM)', 
    'Large (8 Cores, 32GB RAM)',
    'X-Large (16 Cores, 64GB RAM)',
    'GPU-Heavy (8 Cores, 64GB RAM, 1x NVIDIA A100)'
  ];

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

    if (!name.trim()) return setError('Name cannot be empty.');
    const nameRegex = /^[a-zA-Z0-9\s\-]+$/;
    if (!nameRegex.test(name)) return setError('Name can only contain letters, numbers, spaces, and dashes.');
    
    const isDuplicate = existingSites.some(site => site.name.toLowerCase() === name.trim().toLowerCase());
    if (isDuplicate) return setError('A resource with this name already exists.');

    let newSiteData = {
      name: name.trim(),
      status: status,
      resourceType: resourceType
    };

    if (resourceType === 'slices-vm') {
      newSiteData = { ...newSiteData, os, cpuCores: Number(cpuCores), ramGB: Number(ramGB), storageTB: Number(storageTB) };
    } else {
      newSiteData = { ...newSiteData, k8sVersion, workerNodes: Number(workerNodes), nodeFlavor };
    }

    onSave(newSiteData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col h-135" onClick={(e) => e.stopPropagation()}>

        <div className="shrink-0">
          <div className="flex items-center justify-between p-6 pb-5">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">
                Step {currentStep} of 2
              </span>
              <h2 className="text-xl font-bold text-black tracking-tight">
                {currentStep === 1 ? 'Choose Resource Type' : `Set ${resourceType === 'slices-vm' ? 'VM' : 'Cluster'} Parameters`}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="w-full h-1 bg-gray-100">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        <div className={`p-8 flex-1 flex flex-col justify-start overflow-y-auto ${error ? 'no-scrollbar' : ''}`}>
          {error && (
             <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium animate-in fade-in slide-in-from-top-2 shrink-0">
               {error}
             </div>
          )}

          {currentStep === 1 && (
            <div className="flex items-center justify-center gap-6 h-full">
              <div 
                onClick={() => setResourceType('slices-vm')}
                className={`w-48 h-48 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${resourceType === 'slices-vm' ? 'text-primary border-primary border-3 scale-105' : 'border-gray-100 bg-white text-black'}`}
              >
                <MonitorStop size={48} className="mb-4" />
                <h3 className="font-bold text-black">Slices VM</h3>
              </div>

              <div 
                onClick={() => setResourceType('kubernetes-cluster')}
                className={`w-48 h-48 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all ${resourceType === 'kubernetes-cluster' ? 'text-primary border-primary border-3 scale-105' : 'border-gray-100 bg-white text-black'}`}
              >
                <ShipWheel size={48} className="mb-4" />
                <h3 className="font-bold text-black">K8S Cluster</h3>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 max-w-xl mx-auto w-full py-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Resource Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Frontend Server"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="in-use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <hr className="border-gray-100" />

              {resourceType === 'slices-vm' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Operating System</label>
                      <select value={os} onChange={(e) => setOs(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                        {osOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">CPU Cores</label>
                      <select value={cpuCores} onChange={(e) => setCpuCores(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                        {coresOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">RAM (GB)</label>
                      <select value={ramGB} onChange={(e) => setRamGB(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                        {ramOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Storage (TB)</label>
                      <select value={storageTB} onChange={(e) => setStorageTB(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                        {storageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">K8s Version</label>
                      <select value={k8sVersion} onChange={(e) => setK8sVersion(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                        {versionOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Worker Nodes</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={workerNodes} 
                        onChange={(e) => setWorkerNodes(e.target.value)}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Node Flavor</label>
                    <select value={nodeFlavor} onChange={(e) => setNodeFlavor(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer">
                      {flavorOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-5 flex items-center justify-end gap-3 border-t border-gray-100 rounded-b-3xl shrink-0">
          <button 
            type="button" 
            onClick={currentStep === 1 ? onClose : handleBack} 
            className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep === 1 ? (
            <button 
              type="button" 
              onClick={handleNext}
              disabled={!resourceType}
              className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                resourceType 
                  ? 'bg-primary text-white hover:bg-blue-600 cursor-pointer shadow-sm' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
              }`}
            >
              Continue
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary rounded-xl hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
            >
              Add Site
            </button>
          )}
        </div>

      </div>
    </div>
  );
}