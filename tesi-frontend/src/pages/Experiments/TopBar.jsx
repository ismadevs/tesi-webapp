import { Plus } from 'lucide-react';

// ==========================================
// TOPBAR (Presentational Component)
// ==========================================
// Mostra sempre il titolo, la descrizione e il bottone di aggiunta.

export default function TopBar({ 
  title = "Experiments", 
  description = "Manage and monitor your scientific execution environments"
}) {
  return (
    <div className="mb-12">
      
      {/* IL TITOLO */}
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
        {title}
      </h2>

      {/* IL CONTENITORE FLEX: Mette Sottotitolo e Azioni sulla stessa linea */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* SOTTOTITOLO */}
        <p className="text-lg text-gray-600">
          {description}
        </p>

        {/* AREA AZIONI */}
        <div className="flex items-center gap-4">
          
          {/* Pulsante Add (Ora è sempre visibile) */}
          <button
            onClick={() => console.log("Apri creazione esperimento")}
            className="flex items-center justify-center gap-2 bg-primary text-white px-2 pr-5 pl-3 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>New Experiment</span>
          </button>
          
        </div>
      </div>
    </div>
  );
}