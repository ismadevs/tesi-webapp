import { X } from 'lucide-react';

export default function DeleteConfirmModal({ site, onClose, onConfirm }) {
  // Controllo di sicurezza: se per qualche motivo il sito è null, non renderizziamo la modale
  if (!site) return null;

  return (
    // BACKDROP: Sfondo scuro sfocato a schermo intero. 
    // onClick={onClose} permette di annullare l'azione cliccando semplicemente fuori dalla modale.
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/30 backdrop-blur-md animate-in fade-in duration-200" 
      onClick={onClose}
    >
      {/* MODAL CONTAINER: 
          - max-w-lg: la rende più larga e ariosa rispetto a prima (che era max-w-sm)
          - flex flex-col: ci permette di gestire facilmente header, body e footer 
          - stopPropagation(): impedisce che il click *dentro* la finestra chiuda la modale */}
      <div 
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ==========================================
            HEADER (Titolo e tasto X)
            ========================================== */}
        {/* border-b crea la linea di separazione netta richiesta dallo schizzo */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-black tracking-tight">
            Delete Site
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* ==========================================
            BODY (Messaggio di conferma)
            ========================================== */}
        {/* p-10 dà tantissimo spazio al testo, rendendo il design estremamente pulito */}
        <div className="p-10 text-center">
          <p className="text-lg text-gray-700 leading-relaxed">
            Are you sure you want to delete <strong>{site.name}</strong>?<br/>
            This action cannot be undone.
          </p>
        </div>

        {/* ==========================================
            FOOTER (Azioni)
            ========================================== */}
        {/* border-t crea la linea superiore, bg-gray-50/50 stacca leggermente il footer dal body.
            justify-end spinge i bottoni verso destra, esattamente come nello schizzo. */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button 
            onClick={() => onConfirm(site.id)}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}