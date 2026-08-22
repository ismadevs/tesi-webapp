import { useState } from 'react';
import { X, Clock, AlertCircle } from 'lucide-react';

import { formatDateTime, formatTimeLeft } from './experimentStatus';

// ==========================================
// EXTEND EXPERIMENT MODAL
// ==========================================
// La CLI documenta --duration come "new lifetime, relative durations are
// computed from current time": non è un incremento ma la nuova vita totale a
// partire da adesso.
//
// È una semantica facile da fraintendere, e sbagliarla ACCORCIA la risorsa
// invece di prolungarla. Per questo la modale mostra la scadenza risultante
// calcolata in tempo reale, e avvisa esplicitamente quando la nuova durata
// è inferiore al tempo residuo.

const PRESETS = ['2h', '6h', '12h', '1d', '3d'];

const durationToMs = (duration) => {
  const match = /^(\d+)([mhdw])$/.exec(duration);
  if (!match) return null;

  const [, amount, unit] = match;
  const unitToMs = { m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  return Number(amount) * unitToMs[unit];
};

export default function ExtendExperimentModal({ experiment, onClose, onConfirm }) {
  const [duration, setDuration] = useState('6h');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const ms = durationToMs(duration);
  const newExpiry = ms ? new Date(Date.now() + ms) : null;
  const currentExpiry = experiment.remote.expiresAt
    ? new Date(experiment.remote.expiresAt)
    : null;

  // Il caso da segnalare: la nuova scadenza cade prima di quella attuale.
  const wouldShorten = newExpiry && currentExpiry && newExpiry < currentExpiry;

  const handleSubmit = async () => {
    if (!ms) {
      setError('Use a number followed by m, h, d or w (e.g. 6h).');
      return;
    }

    setError('');
    setIsSaving(true);

    try {
      const serverError = await onConfirm(experiment.id, duration);
      if (serverError) setError(serverError);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >

        <div className="flex items-start justify-between p-8 pb-4">
          <div className="flex items-center gap-3">
            <Clock size={22} className="text-primary" />
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Extend lifetime
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="px-8 pb-6 space-y-5">

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-100 flex items-start gap-3 rounded-2xl">
              <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
              <p className="text-rose-700 text-sm font-medium">{error}</p>
            </div>
          )}

          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-bold text-gray-900">{experiment.spec.name}</span>{' '}
            and its {experiment.resourceCount ?? 0}{' '}
            {experiment.resourceCount === 1 ? 'machine' : 'machines'} will get a new
            lifetime, counted from now.
          </p>

          {/* Scadenza attuale, per dare il riferimento */}
          {currentExpiry && (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Currently expires
              </p>
              <p className="text-sm font-semibold text-gray-900">
                {formatDateTime(currentExpiry.toISOString())}
                <span className="text-gray-400 font-normal ml-2">
                  ({formatTimeLeft(currentExpiry.toISOString())} left)
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              New lifetime
            </label>

            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map((preset) => (
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
              placeholder="6h"
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* La scadenza risultante, calcolata mentre l'utente digita: è ciò
              che rende comprensibile la semantica del comando. */}
          {newExpiry && (
            <div className={`p-4 rounded-2xl border ${
              wouldShorten
                ? 'bg-amber-50 border-amber-100'
                : 'bg-emerald-50 border-emerald-100'
            }`}>
              <p className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${
                wouldShorten ? 'text-amber-600' : 'text-emerald-600'
              }`}>
                Will expire
              </p>
              <p className={`text-sm font-semibold ${
                wouldShorten ? 'text-amber-900' : 'text-emerald-900'
              }`}>
                {formatDateTime(newExpiry.toISOString())}
              </p>

              {wouldShorten && (
                <p className="text-xs text-amber-700 mt-2 leading-relaxed">
                  This is earlier than the current expiry: the lifetime is counted
                  from now, so the experiment would be shortened.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-8 py-5 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="px-6 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Extending...' : 'Extend'}
          </button>
        </div>

      </div>
    </div>
  );
}