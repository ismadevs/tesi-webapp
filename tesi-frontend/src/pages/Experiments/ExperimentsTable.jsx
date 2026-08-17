import { Box, Radio, Database, Clock, Timer } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatTimeLeft, isExpiringSoon } from './experimentStatus';

// ==========================================
// EXPERIMENTS TABLE (Presentational Component)
// ==========================================
// Mostra l'elenco completo degli esperimenti, bozze incluse.
//
// E' la differenza sostanziale rispetto a `slices experiment list`, che conosce
// solo cio' che esiste sull'infrastruttura: qui convivono le intenzioni e le
// realta', e la colonna Status e' cio' che le distingue.

export default function ExperimentsTable({ experiments, onRowClick }) {

  // Intestazioni definite come dati invece che ripetute nel markup:
  // aggiungere o riordinare una colonna diventa una riga sola.
  const columns = [
    { label: 'Experiment', Icon: Box },
    { label: 'Status', Icon: Radio },
    { label: 'Resources', Icon: Database },
    { label: 'Duration', Icon: Clock },
    { label: 'Expires', Icon: Timer },
  ];

  // La scadenza esiste solo dopo la materializzazione: prima del deploy
  // l'esperimento non ha alcuna esistenza su SLICES, quindi nessuna data.
  const renderExpiry = (experiment) => {
    const expiresAt = experiment.remote?.expiresAt;

    if (!expiresAt) {
      return <span className="text-gray-300">—</span>;
    }

    const timeLeft = formatTimeLeft(expiresAt);
    const urgent = isExpiringSoon(expiresAt);

    return (
      <span className={urgent ? 'text-rose-600 font-bold' : 'text-black'}>
        {timeLeft}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">

          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200">
              {columns.map(({ label, Icon }) => (
                <th key={label} className="py-3 px-5 border-r border-gray-200 last:border-r-0">
                  <div className="flex items-center gap-2 text-sm font-semibold text-black">
                    <Icon size={16} />
                    {label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {experiments.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-gray-400">
                  No experiments yet. Create your first one to get started.
                </td>
              </tr>
            ) : (
              experiments.map((exp) => (
                <tr
                  key={exp.id}
                  onClick={() => onRowClick(exp)}
                  className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                >
                  {/* Nome: e' il campo dichiarato dall'utente, quindi vive in spec */}
                  <td className="py-4 px-5 border-r border-gray-100 align-middle">
                    <p className="text-base font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {exp.spec.name}
                    </p>
                  </td>

                  <td className="py-4 px-5 border-r border-gray-100 align-middle">
                    <StatusBadge status={exp.status} />
                  </td>

                  {/* Conteggio calcolato dal backend: in SLICES la risorsa
                      appartiene all'esperimento, quindi si contano quelle
                      che vi fanno riferimento. */}
                  <td className="py-4 px-5 border-r border-gray-100 align-middle">
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-md text-sm font-semibold text-black border border-gray-200">
                      {exp.resourceCount ?? 0}
                    </span>
                  </td>

                  <td className="py-4 px-5 border-r border-gray-100 align-middle text-sm font-semibold text-black">
                    {exp.spec.duration}
                  </td>

                  <td className="py-4 px-5 align-middle text-sm font-semibold">
                    {renderExpiry(exp)}
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