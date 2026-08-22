import { X, Trash2 } from 'lucide-react';

import { STATUS } from './experimentStatus';

// ==========================================
// DELETE EXPERIMENT MODAL
// ==========================================
// Conferma la rimozione del DOCUMENTO dalla piattaforma, non la distruzione
// di risorse su SLICES: sono due operazioni con semantica diversa, e
// confonderle sarebbe un errore di progetto.
//
// Per questo l'azione è ammessa in due soli casi, entrambi innocui:
//   DRAFT      niente è mai stato allocato
//   DESTROYED  le macchine sono già state liberate, resta lo storico
//
// Il testo si adatta al caso, perché il significato per l'utente cambia:
// nel primo butta via un lavoro non ancora fatto, nel secondo archivia
// qualcosa che è già finito.

export default function DeleteExperimentModal({ experiment, onClose, onConfirm }) {
  const isDestroyed = experiment.status === STATUS.DESTROYED;
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
            {isDestroyed ? 'Remove experiment' : 'Delete draft'}
          </h2>
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
            will be removed from the platform.{' '}
            {isDestroyed
              ? 'Its machines have already been released, so nothing on SLICES-RI is affected.'
              : 'Nothing is allocated on SLICES-RI, so no resources are affected.'}
          </p>

          {/* Sulle bozze il conteggio avvisa della cancellazione a cascata.
              Sugli esperimenti distrutti il numero non è più significativo,
              perché le risorse contate sono soltanto storico. */}
          {!isDestroyed && resourceCount > 0 && (
            <p className="text-sm text-gray-600 leading-relaxed">
              Its {resourceCount} draft{' '}
              {resourceCount === 1 ? 'resource' : 'resources'} will be removed as well.
            </p>
          )}

          {isDestroyed && (
            <p className="text-sm text-gray-500 leading-relaxed">
              The specification will no longer be available: duplicate it first if you
              want to keep the configuration.
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
            {isDestroyed ? 'Remove' : 'Delete'}
          </button>
        </div>

      </div>
    </div>
  );
}