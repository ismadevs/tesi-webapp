import { useState } from 'react';
import { ArrowLeft, Database, Pencil, Trash2, Box, Clock, FileText, AlertCircle } from 'lucide-react';

import StatusBadge from './StatusBadge';
import DeleteExperimentModal from './DeleteExperimentModal';
import { STATUS, isEditable, formatTimeLeft, isExpiringSoon, formatDateTime } from './experimentStatus';

// ==========================================
// EXPERIMENT DETAIL (Presentational Component)
// ==========================================
// Corrisponde a `slices experiment show`, ma con una differenza sostanziale:
// mostra anche gli esperimenti che su SLICES non esistono ancora.
//
// Il contrasto fra le due viste, prima e dopo la materializzazione, e' cio' che
// rende visibile la separazione fra specifica e infrastruttura.

export default function ExperimentDetail({ experiment, onBack, onEdit, onDelete }) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const editable = isEditable(experiment);
  const { slicesExperimentId, projectName, createdAt, expiresAt } = experiment.remote;

  // ==========================================
  // BANNER DI STATO
  // ==========================================
  // Le azioni di scrittura scompaiono sui documenti materializzati invece di
  // restare disabilitate, perche' non torneranno mai disponibili. Il banner si
  // fa carico di spiegare l'assenza: una frase al posto giusto informa meglio
  // di un tooltip da cercare passandoci sopra.
  const renderBanner = () => {
    if (experiment.status === STATUS.FAILED) {
      return (
        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
          <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-rose-700">Deployment failed</p>
            <p className="text-sm text-rose-600 mt-1">
              {experiment.error || 'No further details available.'}
            </p>
          </div>
        </div>
      );
    }

    if (editable) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 border-dashed rounded-2xl">
          <p className="text-sm text-gray-600">
            This experiment exists only in the platform. Nothing has been allocated
            on SLICES-RI yet.
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
        <p className="text-sm text-emerald-700">
          This experiment has been created on SLICES-RI. The specification can no
          longer be modified.
        </p>
      </div>
    );
  };

  // Riga di metadato. I dati remoti compaiono solo quando esistono davvero:
  // prima del deploy non hanno alcun valore da mostrare.
  const Field = ({ label, value, mono = false, urgent = false }) => (
    <div>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className={`text-sm font-semibold break-all ${mono ? 'font-mono text-xs' : ''} ${urgent ? 'text-rose-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">

      {/* NAVIGAZIONE */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-md font-semibold text-gray-500 hover:text-black transition-colors py-2 pr-4 w-fit cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Back to Experiments
        </button>
      </div>

      {/* INTESTAZIONE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
          {experiment.spec.name}
        </h1>
        <StatusBadge status={experiment.status} size="lg" />
      </div>

      <div className="mb-10">{renderBanner()}</div>

      {/* SPECIFICA: sempre presente, e' cio' che l'utente ha dichiarato */}
      <section className="mb-10">
        <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-6 flex items-center gap-2">
          <FileText size={16} strokeWidth={2.5} />
          Specification
        </h2>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Field label="Duration" value={experiment.spec.duration} />
          <Field label="Resources" value={experiment.resourceCount ?? 0} />
          <div className="sm:col-span-2">
            <Field
              label="Description"
              value={experiment.spec.description || 'No description provided.'}
            />
          </div>
        </div>
      </section>

      {/* DATI SLICES: presenti solo dopo la materializzazione */}
      {slicesExperimentId && (
        <section className="mb-10">
          <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <Clock size={16} strokeWidth={2.5} />
            SLICES-RI
          </h2>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <Field label="Experiment ID" value={slicesExperimentId} mono />
            </div>
            <Field label="Project" value={projectName || '—'} />
            <Field label="Created" value={formatDateTime(createdAt) || '—'} />
            <Field
              label="Time left"
              value={formatTimeLeft(expiresAt) || '—'}
              urgent={isExpiringSoon(expiresAt)}
            />
            <Field label="Expires" value={formatDateTime(expiresAt) || '—'} />
          </div>
        </section>
      )}

      {/* RISORSE: verranno collegate quando la sezione Resources sara' pronta */}
      <section className="flex-1 mb-10">
        <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-6 flex items-center gap-2">
          <Database size={16} strokeWidth={2.5} />
          Resources — {experiment.resourceCount ?? 0}
        </h2>

        <div className="flex items-center gap-3 text-gray-400 p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
          <Box size={20} />
          <p className="text-sm font-medium">
            No resources attached to this experiment yet.
          </p>
        </div>
      </section>

      {/* AZIONI: visibili solo sulle bozze */}
      {editable && (
        <div className="pt-8 mt-auto flex justify-end items-center gap-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(experiment)}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 bg-white text-black border border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <Pencil size={16} />
            Edit
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center gap-2 bg-white text-black border border-gray-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 cursor-pointer"
          >
            <Trash2 size={16} />
            Delete draft
          </button>
        </div>
      )}

      {isDeleteModalOpen && (
        <DeleteExperimentModal
          experiment={experiment}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={(id) => {
            setIsDeleteModalOpen(false);
            onDelete(id);
          }}
        />
      )}

    </div>
  );
}