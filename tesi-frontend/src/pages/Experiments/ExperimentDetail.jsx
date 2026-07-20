import { ArrowLeft } from 'lucide-react';

// ==========================================
// EXPERIMENT DETAIL (Presentational Component)
// ==========================================
// Questa è la pagina dedicata al singolo esperimento.
// Per ora mostra solo il titolo per confermare che il collegamento funziona.

export default function ExperimentDetail({ experiment, onBack }) {
  return (
    <div className="flex flex-col h-full">
      
      {/* Tasto Back in alto a sinistra */}
      <div className="mb-4">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-black transition-colors px-2 py-1.5 w-fit cursor-pointer"
        >
          <ArrowLeft size={16} strokeWidth={3} />
          Back to Experiments
        </button>
      </div>

      {/* Contenuto segnaposto della pagina */}
      <div className="flex-1 flex items-center justify-center bg-white rounded-2xl border border-gray-200">
        <p className="text-xl font-medium text-gray-500">
          Pagina dell'esperimento - <span className="font-bold text-gray-900">{experiment.name}</span>
        </p>
      </div>
      
    </div>
  );
}