import { X, Trash2 } from 'lucide-react';

// ==========================================
// DELETE EXPERIMENT MODAL
// ==========================================
// Conferma l'eliminazione della SPECIFICA, non la distruzione di risorse su
// SLICES: sono due operazioni con semantica diversa, e confonderle sarebbe un
// errore di progetto. Per questo la modale compare solo sulle bozze, dove non
// esiste nulla di allocato.
//
// Le risorse in bozza collegate vengono rimosse insieme all'esperimento. Il
// conteggio è dichiarato esplicitamente perché una cancellazione a cascata
// silenziosa sorprenderebbe l'utente.

export default function DeleteExperimentModal({ experiment, onClose, onConfirm }) {
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
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Delete draft
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-8 pb-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            The draft{' '}
            <span className="font-bold text-gray-900">{experiment.spec.name}</span>{' '}
            will be removed from the platform. Nothing is allocated on SLICES-RI,
            so no resources are affected.
          </p>

          {resourceCount > 0 && (
            <p className="text-sm text-gray-600 leading-relaxed mt-3">
              Its {resourceCount} draft {resourceCount === 1 ? 'resource' : 'resources'}{' '}
              will be removed as well.
            </p>
          )}
        </div>

        <div className="px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(experiment.id)}
            className="px-6 py-2.5 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors cursor-pointer flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}