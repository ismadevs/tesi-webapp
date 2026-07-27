import { Box, Radio, Database, Calendar } from 'lucide-react';

// ==========================================
// EXPERIMENTS TABLE (Presentational Component)
// ==========================================
// Questo componente si occupa ESCLUSIVAMENTE di renderizzare i dati visivamente.
// Riceve la lista degli esperimenti (tramite la prop 'experiments') dal componente genitore.

export default function ExperimentsTable({ experiments, onRowClick }) {
  
  // ==========================================
  // HELPER: GESTIONE DEI BADGE DI STATO
  // ==========================================
  // Questa funzione riceve lo stato testuale dell'esperimento e restituisce 
  // un badge visivo colorato corrispondente.
  const renderStatus = (status) => {
    switch (status) {
      case 'running':
        // Stato RUNNING: Colore BLU con pallino che pulsa (animate-pulse)
        return (
          <span className="flex items-center gap-2 text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Running
          </span>
        );
      case 'completed':
        // Stato COMPLETED: Colore VERDE (emerald)
        return (
          <span className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md w-fit">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Completed
          </span>
        );
      case 'stopped':
      default:
        // Stato STOPPED: Colore ROSSO (rose)
        return (
          <span className="flex items-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md w-fit">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Stopped
          </span>
        );
    }
  };

  // ==========================================
  // HELPER: FORMATTAZIONE DATE
  // ==========================================
  // Converte la data dal formato ISO (es. "2026-06-10T09:15:00Z")
  // a un formato più leggibile (es. "10 Jun 2026").
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  return (
    // CONTENITORE PRINCIPALE: Bordo grigio, sfondo bianco, bordi smussati
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* ==========================================
              INTESTAZIONE (THEAD)
              ========================================== */}
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              {/* Colonna 1: Nome Esperimento */}
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Box size={16} className="text-black" />
                  Experiment
                </div>
              </th>

              {/* Colonna 2: Status */}
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Radio size={16} className="text-black" />
                  Status
                </div>
              </th>

              {/* Colonna 3: Risorse */}
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Database size={16} className="text-black" />
                  Resources
                </div>
              </th>

              {/* Colonna 4: Data di Creazione */}
              <th className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-black">
                  <Calendar size={16} className="text-black" />
                  Created At
                </div>
              </th>
            </tr>
          </thead>

          {/* ==========================================
              CORPO DELLA TABELLA (TBODY)
              ========================================== */}
          <tbody>
            {/* Controllo: la tabella è vuota? */}
            {experiments.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-12 text-center text-gray-400">
                  No experiments found. Create your first one!
                </td>
              </tr>
            ) : (
              // Ciclo (map) per renderizzare ogni singolo esperimento
              experiments.map((exp) => (
                <tr
                  key={exp.id}
                  onClick={() => onRowClick(exp)}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                >
                  {/* Cella Nome: Mostriamo solo il titolo (descrizione rimossa), allineato al centro (align-middle) */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-middle">
                    <p className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors cursor-pointer">
                      {exp.name}
                    </p>
                  </td>

                  {/* Cella Status: Invoca l'helper renderStatus */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-middle">
                    {renderStatus(exp.status)}
                  </td>

                  {/* Cella Risorse: Stile tipo tag con bordo per il conteggio */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-middle">
                    <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-md text-sm font-semibold text-black border border-gray-200">
                      <span>{exp.resourceCount}</span>
                    </span>
                  </td>

                  {/* Cella Data */}
                  <td className="py-4 px-5 border-r border-gray-100 last:border-r-0 align-middle text-sm font-semibold text-black">
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