import { ArrowLeft, Calendar, Database, Server, Pencil, Trash2, Box } from 'lucide-react';

// ==========================================
// EXPERIMENT DETAIL (Presentational Component)
// ==========================================

export default function ExperimentDetail({ experiment, onBack }) {

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-2 text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-md border border-emerald-100 w-fit">
            <span className="w-2 h-2 rounded-md bg-emerald-500 animate-pulse"></span>
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-md border border-blue-100 w-fit">
            <span className="w-2 h-2 rounded-md bg-blue-500"></span>
            Completed
          </span>
        );
      case 'stopped':
      default:
        return (
          <span className="flex items-center gap-2 text-sm font-semibold text-rose-600 bg-rose-50 px-3 py-1 rounded-md border border-rose-100 w-fit">
            <span className="w-2 h-2 rounded-md bg-rose-500"></span>
            Stopped
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* ==========================================
          TOP ACTIONS
          ========================================== */}
      <div className="mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-md font-semibold text-gray-500 hover:text-black transition-colors py-2 pr-4 w-fit group cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Back to Experiments
        </button>
      </div>

      {/* ==========================================
          HEADER SECTION
          ========================================== */}
      <div className="flex flex-col gap-4 mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
            {experiment.name}
          </h1>
          {renderStatusBadge(experiment.status)}
        </div>
        
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400">
          <Calendar size={15} />
          <span>Created on {formatDate(experiment.createdAt)}</span>
        </div>
      </div>

      {/* ==========================================
          DESCRIPTION SECTION
          ========================================== */}
      <div className="mb-16">
        <p className="text-lg text-black leading-relaxed font-medium">
          {experiment.description || "No description provided."}
        </p>
      </div>

      {/* ==========================================
          RESOURCES SECTION
          ========================================== */}
      <div className="flex-1 mb-12">
        <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-8 flex items-center gap-2">
          <Database size={16} strokeWidth={2.5}/>
          Allocated Resources - {experiment.allocatedResources?.length || 0}
        </h2>

        {(!experiment.allocatedResources || experiment.allocatedResources.length === 0) ? (
          <div className="flex items-center gap-3 text-gray-400">
            <Box size={20} />
            <p className="text-sm font-medium">No resources attached to this experiment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {experiment.allocatedResources.map((res, index) => (
              <div key={index} className="pl-4 border-l-2 border-gray-200 hover:border-black transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                    ID: {res.resourceId}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-bold rounded uppercase tracking-wider">
                    {res.type === 'full' ? 'FULL ACCESS' : 'NAMESPACE'}
                  </span>
                </div>
                {res.namespaceName && (
                  <div className="text-base font-medium text-gray-900 flex items-center gap-2 mt-2">
                    <Server size={15} className="text-gray-400" />
                    {res.namespaceName}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==========================================
          BOTTOM CONTROLS
          ========================================== */}
      <div className="pt-8 mt-auto flex justify-end items-center gap-4">
        <button className="px-4 py-2 rounded-lg font-semibold text-md transition-all duration-400 flex items-center justify-center gap-2 bg-white text-black border border-gray-200 hover:bg-blue-500 hover:text-white hover:border-white cursor-pointer">
          <Pencil size={16} />
          Edit
        </button>

        <button className="px-4 py-2 rounded-lg font-semibold text-md transition-all duration-400 flex items-center justify-center gap-2 bg-white text-black border border-gray-200 hover:bg-red-500 hover:text-white hover:border-white cursor-pointer">
          <Trash2 size={16} />
          Delete
        </button>
      </div>
      
    </div>
  );
}