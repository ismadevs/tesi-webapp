import { X, AlertTriangle } from 'lucide-react';

// ==========================================
// DESTROY EXPERIMENT MODAL
// ==========================================
// Conferma la distruzione di hardware reale su SLICES-RI. Una sola
// invocazione di `slices experiment delete` porta via l'esperimento e tutte
// le risorse che contiene, quindi la conferma deve dichiarare quante macchine
// verranno liberate.
//
// Il testo distingue esplicitamente cosa viene perso e cosa resta: è la
// differenza fra distruggere l'infrastruttura e rimuovere la specifica.

export default function DestroyExperimentModal({ experiment, onClose, onConfirm }) {
  const resourceCount = experiment.resourceCount ?? 0;

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
              Destroy experiment
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
            <span className="font-bold text-gray-900">{experiment.spec.name}</span>{' '}
            will be released on SLICES-RI
            {resourceCount > 0 && (
              <>
                , together with its {resourceCount}{' '}
                {resourceCount === 1 ? 'machine' : 'machines'}
              </>
            )}
            . Any data stored on them will be lost and the action cannot be undone.
          </p>

          <p className="text-sm text-gray-500 leading-relaxed">
            The specification stays in the platform: you can review it, or duplicate
            it to run the experiment again.
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
            onClick={() => onConfirm(experiment.id)}
            className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors cursor-pointer"
          >
            Destroy
          </button>
        </div>
      </div>
    </div>
  );
}