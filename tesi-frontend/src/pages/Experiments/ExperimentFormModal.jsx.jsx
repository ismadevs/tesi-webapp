import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

// ==========================================
// EXPERIMENT FORM MODAL
// ==========================================
// Un solo componente per creazione e modifica: i campi sono gli stessi, cambia
// solo il valore iniziale e l'endpoint chiamato dal genitore. Passando la prop
// `experiment` la modale entra in modalita' modifica.
//
// I campi sono tre perche' tre sono i parametri accettati da
// `slices experiment create`: il nome, la descrizione e la durata.

// Stesso vincolo applicato dal backend: il nome finisce dentro identificatori
// e viene passato come argomento alla CLI, dove spazi e caratteri speciali
// creano problemi di quoting.
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Valori proposti. Il default di SLICES sarebbe 3h, ma tenere corto durante
// lo sviluppo evita di lasciare hardware condiviso occupato per errore.
const DURATION_PRESETS = ['2h', '8h', '24h', '3d'];

export default function ExperimentFormModal({ experiment, onClose, onSave }) {
  const isEditMode = Boolean(experiment);

  const [name, setName] = useState(experiment?.spec.name ?? '');
  const [description, setDescription] = useState(experiment?.spec.description ?? '');
  const [duration, setDuration] = useState(experiment?.spec.duration ?? '2h');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Validazione locale: intercetta gli errori evidenti senza un giro di rete.
  // Il backend ripete comunque tutti i controlli, inclusa l'unicita' del nome,
  // che il frontend non puo' verificare in modo affidabile.
  const validate = () => {
    const trimmed = name.trim();

    if (!trimmed) return 'Experiment name is required.';
    if (trimmed.length > 60) return 'Experiment name cannot exceed 60 characters.';
    if (!NAME_PATTERN.test(trimmed)) {
      return 'Use lowercase letters, digits and hyphens only (e.g. latency-benchmark).';
    }
    if (!/^\d+[mhdw]$/.test(duration.trim())) {
      return 'Duration must be a number followed by m, h, d or w (e.g. 2h).';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      // Il genitore restituisce un messaggio in caso di errore dal server,
      // tipicamente il conflitto sul nome gia' occupato.
      const serverError = await onSave({
        spec: {
          name: name.trim(),
          description: description.trim(),
          duration: duration.trim(),
        },
      });

      if (serverError) setError(serverError);
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium ' +
    'text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 ' +
    'focus:border-primary transition-all';

  const labelClass =
    'block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-start justify-between p-8 pb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isEditMode ? 'Edit experiment' : 'New experiment'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              The experiment is saved as a draft. Nothing is allocated yet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* CORPO */}
        <div className="px-8 pb-2 flex-1 overflow-y-auto space-y-6">

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 flex items-start gap-3 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-rose-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="latency-benchmark"
              autoFocus
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-2">
              Lowercase letters, digits and hyphens. Must be unique: on SLICES-RI a name
              stays reserved even after deletion.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Description
              <span className="text-gray-400 font-medium normal-case tracking-normal ml-1">
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this experiment for?"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className={labelClass}>Duration</label>

            {/* Scelte rapide piu' campo libero: i preset coprono i casi comuni,
                il campo resta editabile per valori arbitrari. */}
            <div className="flex flex-wrap gap-2 mb-3">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDuration(preset)}
                  className={`px-4 py-1.5 text-sm font-bold rounded-lg border transition-all cursor-pointer ${
                    duration === preset
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="2h"
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-2">
              Applies to the whole experiment and to every resource it contains.
              Maximum 90 days.
            </p>
          </div>
        </div>

        {/* AZIONI */}
        <div className="px-8 py-5 mt-4 flex items-center justify-end gap-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create draft'}
          </button>
        </div>

      </div>
    </div>
  );
}