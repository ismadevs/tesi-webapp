import { Box, Radio, Database, Calendar } from 'lucide-react';

// ==========================================
// EXPERIMENTS TABLE (Presentational Component)
// ==========================================
// Tabella aggiornata con griglia leggera, tipografia naturale e icone.

export default function ExperimentsTable({ experiments }) {
  
  // Funzione helper per renderizzare lo status
  const renderStatus = (status) => {
    switch (status) {
      case 'running':
        return (
          <span className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md w-fit border border-blue-100">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Running
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit border border-emerald-100">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Completed
          </span>
        );
      case 'stopped':
      default:
        return (
          <span className="flex items-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md w-fit border border-rose-100">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Stopped
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          
          {/* INTESTAZIONE */}
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Box size={16} className="text-black" />
                  Experiment Name
                </div>
              </th>
              
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Radio size={16} className="text-black" />
                  Status
                </div>
              </th>
              
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Database size={16} className="text-black" />
                  Resources
                </div>
              </th>
              
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Calendar size={16} className="text-black" />
                  Created At
                </div>
              </th>

            </tr>
          </thead>

          {/* CORPO */}
          <tbody>
            {experiments.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-400">
                  No experiments found. Create your first one!
                </td>
              </tr>
            ) : (
              experiments.map((exp) => (
                <tr 
                  key={exp.id} 
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors group"
                >
                  
                  {/* Cella Nome */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-top">
                    <p className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors cursor-pointer">
                      {exp.name}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {exp.description}
                    </p>
                  </td>

                  {/* Cella Status */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-top">
                    {renderStatus(exp.status)}
                  </td>

                  {/* Cella Risorse */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-top">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                      {exp.resourceCount} {exp.resourceCount === 1 ? 'Resource' : 'Resources'}
                    </span>
                  </td>

                  {/* Cella Data */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-top text-sm font-medium text-gray-600">
                    {formatDate(exp.createdAt)}
                  </td>

                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}