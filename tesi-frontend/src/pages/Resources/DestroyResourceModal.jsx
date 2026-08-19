import { X, AlertTriangle } from 'lucide-react';

// ==========================================
// DESTROY RESOURCE MODAL
// ==========================================
// Conferma la distruzione di hardware reale su SLICES-RI. È operazione
// diversa dall'eliminazione di una bozza e irreversibile, quindi la conferma
// è più esplicita: dichiara cosa viene perso e cosa invece resta.

export default function DestroyResourceModal({ resource, onClose, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-8 pb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={22} className="text-rose-500" />
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Destroy resource
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-8 pb-6 space-y-3">
          <p className="text-sm text-gray-600 leading-relaxed">
            The machine{' '}
            <span className="font-bold text-gray-900">{resource.spec.name}</span>{' '}
            will be released on SLICES-RI. Any data stored on it will be lost
            and the action cannot be undone.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            The specification stays in the platform, so you keep a record of
            what was allocated.
          </p>
        </div>

        <div className="px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(resource.id)}
            className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
          >
            Destroy
          </button>
        </div>
      </div>
    </div>
  );
}