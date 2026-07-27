import { useState, useEffect } from 'react';
import { X, AlertCircle, Info, CheckCircle2, Circle, Database } from 'lucide-react';
import ResourceDetailsModal from '../Resources/ResourceDetailsModal';

export default function AddExperimentModal({ onClose, onSave, availableResources = [] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('stopped');

  const [selectedIds, setSelectedIds] = useState(new Set());
  const [resourceConfigs, setResourceConfigs] = useState({});
  
  const [infoModalResource, setInfoModalResource] = useState(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) return setError('Experiment Name cannot be empty.');
      setError('');
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(1);
  };

  const toggleResourceSelection = (resId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(resId)) {
      newSelected.delete(resId);
      const newConfigs = { ...resourceConfigs };
      delete newConfigs[resId];
      setResourceConfigs(newConfigs);
    } else {
      newSelected.add(resId);
      setResourceConfigs(prev => ({
        ...prev,
        [resId]: { type: 'full' }
      }));
    }
    setSelectedIds(newSelected);
  };

  const updateResourceConfig = (resId, key, value) => {
    setResourceConfigs(prev => ({
      ...prev,
      [resId]: { ...prev[resId], [key]: value }
    }));
  };

  const handleOpenInfo = async (e, resourceId) => {
    e.stopPropagation();
    try {
      const response = await fetch('http://localhost:3000/api/resources');
      if (!response.ok) throw new Error('Errore di rete');
      const allResources = await response.json();
      const found = allResources.find(r => r.id === resourceId);
      if (found) setInfoModalResource(found);
    } catch (err) {
      console.error("Errore recupero dettagli:", err);
    }
  };

  const handleSubmit = () => {
    setError('');

    const allocatedResources = Array.from(selectedIds).map(id => {
      const config = resourceConfigs[id];
      const resourceData = availableResources.find(r => r.id === id);
      
      return {
        resourceId: id,
        resourceName: resourceData?.name || 'Unknown',
        type: config.type
      };
    });

    const newExperimentData = {
      name: name.trim(),
      description: description.trim(),
      status: status,
      allocatedResources: allocatedResources
    };

    onSave(newExperimentData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-4xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

        <div className="shrink-0">
          <div className="flex items-center justify-between p-8 pb-6">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">
                Step {currentStep} of 2
              </span>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {currentStep === 1 ? 'Experiment Details' : 'Allocate Resources'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          <div className="w-full h-1 bg-gray-100">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        <div className="p-8 flex-1 overflow-y-auto no-scrollbar relative bg-gray-50/30">
          
          {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
               <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
               <p className="text-red-700 text-sm font-medium">{error}</p>
             </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300 max-w-2xl mx-auto">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Experiment Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Latency Benchmarking 101"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                  Description <span className="text-gray-400 font-medium normal-case tracking-normal ml-1">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the scientific goal of this experiment..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Initial Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {['stopped', 'running', 'completed'].map((opt) => (
                    <div 
                      key={opt}
                      onClick={() => setStatus(opt)}
                      className={`flex items-center justify-center gap-2 py-3 border rounded-xl cursor-pointer transition-all ${
                        status === opt 
                          ? 'border-blue-500 bg-blue-50 shadow-sm' 
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        opt === 'running' ? 'bg-emerald-500' : opt === 'completed' ? 'bg-blue-500' : 'bg-rose-500'
                      }`}></div>
                      <span className={`text-sm font-bold capitalize ${status === opt ? 'text-blue-700' : 'text-gray-600'}`}>
                        {opt}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto">
              
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm font-semibold text-gray-500">
                  Select the resources you want to attach to this experiment.
                </p>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                  {selectedIds.size} Selected
                </span>
              </div>

              {availableResources.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Database size={48} className="mb-4 opacity-50" />
                  <p className="text-base font-semibold text-gray-600">No resources available.</p>
                  <p className="text-sm text-gray-400 mt-1">Go to the Resources page to create some first.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {availableResources.map(res => {
                    const isSelected = selectedIds.has(res.id);
                    const isK8s = res.siteId && res.siteId.includes('baremetal');
                    const config = resourceConfigs[res.id];

                    return (
                      <div 
                        key={res.id}
                        className={`flex items-center justify-between p-4 bg-white border-2 rounded-2xl transition-all ${
                          isSelected 
                            ? 'border-blue-500 shadow-sm' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div 
                          className="flex items-center gap-4 flex-1 cursor-pointer" 
                          onClick={() => toggleResourceSelection(res.id)}
                        >
                          <div className="shrink-0">
                            {isSelected ? (
                              <CheckCircle2 size={24} className="text-blue-500" />
                            ) : (
                              <Circle size={24} className="text-gray-300" />
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <h3 className="text-base font-bold text-gray-900 truncate">
                              {res.name}
                            </h3>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                              {isK8s ? 'KUBERNETES CLUSTER' : 'VIRTUAL MACHINE'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 pl-4 shrink-0">
                          {isSelected && isK8s && (
                            <div className="hidden sm:flex p-1 bg-gray-100 rounded-xl" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => updateResourceConfig(res.id, 'type', 'full')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                  config?.type === 'full' 
                                    ? 'bg-white shadow-sm text-gray-900' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                Full
                              </button>
                              <button
                                onClick={() => updateResourceConfig(res.id, 'type', 'namespace')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                  config?.type === 'namespace' 
                                    ? 'bg-white shadow-sm text-gray-900' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                Namespace
                              </button>
                            </div>
                          )}

                          <button
                            onClick={(e) => handleOpenInfo(e, res.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors shrink-0"
                          >
                            <Info size={20} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

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
              className="px-8 py-2.5 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
            >
              Continue
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              className="px-8 py-2.5 text-sm font-bold text-white bg-blue-500 rounded-xl hover:bg-blue-600 transition-colors cursor-pointer shadow-sm"
            >
              Create Experiment
            </button>
          )}
        </div>

      </div>

      {infoModalResource && (
        <ResourceDetailsModal
          resource={infoModalResource}
          onClose={() => setInfoModalResource(null)}
        />
      )}
    </div>
  );
}