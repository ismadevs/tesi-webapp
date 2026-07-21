import { X, AlertTriangle } from 'lucide-react';

export default function DeleteConfirmModal({ resource, onClose, onConfirm }) {
  // Controllo di sicurezza
  if (!resource) return null;

  return (
    // BACKDROP: Allineato alle altre modali
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      {/* MODAL CONTAINER */}
      <div 
        className="bg-white rounded-4xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* ==========================================
            HEADER
            ========================================== */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              Delete Resource
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>
        
        {/* ==========================================
            BODY
            ========================================== */}
        <div className="p-8 text-left">
          <p className="text-lg text-gray-700 leading-relaxed">
            Are you sure you want to permanently destroy <strong className="text-gray-900">{resource.name}</strong>?
          </p>
        </div>

        {/* ==========================================
            FOOTER
            ========================================== */}
        <div className="px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          <button 
            onClick={() => onConfirm(resource.id)}
            className="px-6 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow-sm"
          >
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}