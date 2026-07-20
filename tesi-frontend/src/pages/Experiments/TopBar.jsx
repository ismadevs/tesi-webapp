import { Plus } from 'lucide-react';

// ==========================================
// TOPBAR (Presentational Component)
// ==========================================
// Riceve titolo, descrizione e la visibilità del bottone come "props".
// In questo modo, quando l'utente selezionerà un esperimento, il genitore (ExperimentPage)
// cambierà semplicemente queste props e la TopBar si aggiornerà da sola.

export default function TopBar({ 
  title = "Experiments", 
  description = "Manage and monitor your scientific execution environments", 
  showAddButton = true 
}) {
  return (
    <div className="mb-12">
      
      {/* IL TITOLO */}
      {/* Renderizzato dinamicamente tramite la prop 'title' */}
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
        {title}
      </h2>

      {/* IL CONTENITORE FLEX: Mette Sottotitolo e Azioni sulla stessa linea */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* SOTTOTITOLO */}
        {/* Renderizzato dinamicamente tramite la prop 'description' */}
        <p className="text-lg text-gray-600 mt-4">
          {description}
        </p>

        {/* AREA AZIONI */}
        <div className="flex items-center gap-4">
          
          {/* Pulsante Add (Renderizzato condizionalmente) */}
          {/* Se showAddButton è true, mostra il pulsante. Altrimenti non mostra nulla. */}
          {showAddButton && (
            <button
              // Per ora fa solo un console.log come richiesto per questa fase
              onClick={() => console.log("Apri creazione esperimento")}
              className="flex items-center justify-center gap-2 bg-primary text-white px-2 pr-5 pl-3 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer"
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>New Experiment</span>
            </button>
          )}
          
        </div>
      </div>
    </div>
  );
}