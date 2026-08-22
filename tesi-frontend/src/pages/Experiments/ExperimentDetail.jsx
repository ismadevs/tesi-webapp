import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Database, Pencil, Trash2, Copy, Clock,
  Download, FileText, AlertCircle,
} from 'lucide-react';

import StatusBadge from './StatusBadge';
import DeleteExperimentModal from './DeleteExperimentModal';
import DestroyExperimentModal from './DestroyExperimentModal';
import ExtendExperimentModal from './ExtendExperimentModal';
import {
  STATUS, isEditable, isDestroyable, isRemovable, isExtendable,
  formatTimeLeft, isExpiringSoon, formatDateTime,
} from './experimentStatus';

const API_URL = 'http://localhost:3000/api/experiments';

// ==========================================
// EXPERIMENT DETAIL (Presentational Component)
// ==========================================
// Corrisponde a `slices experiment show`, ma con una differenza sostanziale:
// mostra anche gli esperimenti che su SLICES non esistono ancora, o che non
// esistono più.
//
// LAYOUT A TRE FASCE
// Intestazione e azioni restano fisse, solo la parte centrale scorre. Le
// informazioni di stato e i comandi sono ciò che serve più spesso, e farli
// sparire durante lo scorrimento costringerebbe a tornare su ogni volta.
//
// LE AZIONI HANNO SEMANTICA DIVERSA
//   Duplicate  sempre disponibile, copia la specifica come nuova bozza
//   Export     scarica la specifica come artefatto autonomo
//   Extend     prolunga la vita di esperimento e macchine
//   Destroy    libera hardware reale su SLICES, irreversibile
//   Delete     rimuove il documento dalla piattaforma
//
// Destroy e Delete non sono la stessa azione a stati diversi: il percorso
// completo su un esperimento attivo è DEPLOYED → destroy → DESTROYED → delete.

export default function ExperimentDetail({
  experiment, onBack, onEdit, onDelete, onDuplicate, onDestroy, onExtend,
}) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDestroyModalOpen, setIsDestroyModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);

  const editable = isEditable(experiment);
  const destroyable = isDestroyable(experiment);
  const removable = isRemovable(experiment);
  const extendable = isExtendable(experiment);

  const isDestroyed = experiment.status === STATUS.DESTROYED;
  const { slicesExperimentId, projectName, createdAt, expiresAt } = experiment.remote;

  // ==========================================
  // ESPORTAZIONE
  // ==========================================
  // Il download avviene lato browser e non tramite navigazione: l'endpoint
  // risponde con Content-Disposition, ma aprirlo con window.open lascerebbe
  // una scheda vuota. Si scarica il contenuto e si simula un click su un link
  // temporaneo, così il file finisce nei Download senza cambiare pagina.
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_URL}/${experiment.id}/export`);
      if (!response.ok) throw new Error();

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${experiment.spec.name}.json`;
      link.click();

      // L'URL temporaneo va revocato, altrimenti il blob resta in memoria
      // finché la pagina non viene chiusa.
      URL.revokeObjectURL(url);
    } catch {
      // Silenzioso: un download fallito è evidente all'utente.
    }
  };

  // ==========================================
  // BANNER DI STATO
  // ==========================================
  // Le azioni di scrittura scompaiono sui documenti materializzati invece di
  // restare disabilitate, perché non torneranno mai disponibili. Il banner si
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

    if (isDestroyed) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <p className="text-sm text-gray-600">
            The machines of this experiment have been released on SLICES-RI.
            The specification is kept here: duplicate it to run the experiment again.
          </p>
        </div>
      );
    }

    if (experiment.isExpired) {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <p className="text-sm text-gray-600">
            This experiment has expired and its machines were released automatically
            by the infrastructure. The specification is kept here.
          </p>
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
          This experiment is running on SLICES-RI. The specification can no longer
          be modified.
        </p>
      </div>
    );
  };

  // Riga di metadato. I dati remoti compaiono solo quando esistono davvero.
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

  const buttonBase =
    'px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ' +
    'flex items-center gap-2 cursor-pointer border whitespace-nowrap';

  return (
    // min-h-0 è necessario perché un contenitore flex, di default, si espande
    // per contenere i figli: senza, l'area centrale crescerebbe oltre lo
    // schermo invece di scorrere al proprio interno.
    <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-300">

      {/* ==========================================
          FASCIA SUPERIORE FISSA
          ==========================================
          shrink-0 impedisce che venga compressa quando il contenuto centrale
          è lungo. Contiene navigazione, titolo, stato e banner: le
          informazioni che servono più spesso mentre si consulta il resto. */}
      <div className="shrink-0 pb-6 bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-md font-semibold text-gray-500 hover:text-black transition-colors py-2 pr-4 mb-6 w-fit cursor-pointer"
        >
          <ArrowLeft size={18} strokeWidth={3} />
          Back to Experiments
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className={`text-4xl font-bold tracking-tight ${
            isDestroyed || experiment.isExpired ? 'text-gray-500' : 'text-gray-900'
          }`}>
            {experiment.spec.name}
          </h1>
          <StatusBadge
            status={experiment.status}
            expired={experiment.isExpired}
            size="lg"
          />
        </div>

        {renderBanner()}
      </div>

      {/* ==========================================
          AREA CENTRALE SCORREVOLE
          ==========================================
          flex-1 le fa occupare tutto lo spazio rimasto fra le due fasce fisse,
          overflow-y-auto abilita lo scorrimento interno, no-scrollbar nasconde
          l'indicatore mantenendolo funzionante. */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar py-6">

        {/* SPECIFICA: sempre presente, è ciò che l'utente ha dichiarato e
            resta leggibile anche dopo che le macchine sono state liberate */}
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

              {/* Su un esperimento distrutto o scaduto il conto alla rovescia
                  non ha più significato: le macchine sono già state liberate. */}
              {!isDestroyed && !experiment.isExpired && (
                <Field
                  label="Time left"
                  value={formatTimeLeft(expiresAt) || '—'}
                  urgent={isExpiringSoon(expiresAt)}
                />
              )}
              <Field label="Expires" value={formatDateTime(expiresAt) || '—'} />
            </div>
          </section>
        )}

        {/* RISORSE
            Le card e le azioni vivono nella sezione Resources: qui basta il
            conteggio e un collegamento diretto, così non esistono due viste
            della stessa cosa da tenere allineate. */}
        <section>
          <h2 className="text-sm font-bold text-black uppercase tracking-widest mb-6 flex items-center gap-2">
            <Database size={16} strokeWidth={2.5} />
            Resources
          </h2>

          <Link
            to={`/resources?experiment=${experiment.id}`}
            className="flex items-center justify-between p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div>
              <p className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {experiment.resourceCount ?? 0}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {editable
                  ? 'Add or edit the machines this experiment will allocate'
                  : 'Machines allocated by this experiment'}
              </p>
            </div>

            <span className="flex items-center gap-2 text-sm font-bold text-black">
              Open
              <ArrowRight size={16} strokeWidth={2.5} />
            </span>
          </Link>
        </section>

      </div>

      {/* ==========================================
          FASCIA INFERIORE FISSA
          ==========================================
          I comandi restano raggiungibili qualunque sia la posizione dello
          scorrimento. flex-wrap evita che su schermi stretti escano dal
          contenitore. */}
      <div className="shrink-0 pt-6 flex flex-wrap justify-end items-center gap-3 border-t border-gray-100 bg-white">

        {/* Duplicate è sempre disponibile: non tocca l'infrastruttura, copia
            soltanto la specifica. È ciò che rende riutilizzabile un
            esperimento materializzato, scaduto o distrutto. */}
        <button
          onClick={() => onDuplicate(experiment.id)}
          className={`${buttonBase} bg-white text-black border-gray-200 hover:bg-gray-50`}
        >
          <Copy size={16} />
          Duplicate
        </button>

        {/* Export: la specifica diventa un file autonomo, versionabile con Git
            e condivisibile. È il punto in cui la piattaforma produce un vero
            artefatto di Infrastructure as Code. */}
        <button
          onClick={handleExport}
          className={`${buttonBase} bg-white text-black border-gray-200 hover:bg-gray-50`}
        >
          <Download size={16} />
          Export
        </button>

        {editable && (
          <button
            onClick={() => onEdit(experiment)}
            className={`${buttonBase} bg-white text-black border-gray-200 hover:bg-gray-50`}
          >
            <Pencil size={16} />
            Edit
          </button>
        )}

        {/* Extend: prolunga la vita di esperimento e macchine. È l'azione che
            completa il ciclo di vita, e l'unica risposta possibile all'avviso
            di scadenza mostrato nella Home. */}
        {extendable && (
          <button
            onClick={() => setIsExtendModalOpen(true)}
            className={`${buttonBase} bg-white text-primary border-primary/30 hover:bg-primary/5`}
          >
            <Clock size={16} />
            Extend
          </button>
        )}

        {/* Destroy: libera hardware reale. Azione distruttiva, in evidenza. */}
        {destroyable && (
          <button
            onClick={() => setIsDestroyModalOpen(true)}
            className={`${buttonBase} bg-rose-500 text-white border-rose-500 hover:bg-rose-600`}
          >
            <Trash2 size={16} />
            Destroy
          </button>
        )}

        {/* Delete: rimuove il documento. Innocuo, perché è ammesso solo quando
            nulla è allocato, quindi resta uno stile neutro. */}
        {removable && (
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className={`${buttonBase} bg-white text-black border-gray-200 hover:bg-rose-500 hover:text-white hover:border-rose-500`}
          >
            <Trash2 size={16} />
            {editable ? 'Delete draft' : 'Remove'}
          </button>
        )}
      </div>

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

      {isDestroyModalOpen && (
        <DestroyExperimentModal
          experiment={experiment}
          onClose={() => setIsDestroyModalOpen(false)}
          onConfirm={(id) => {
            setIsDestroyModalOpen(false);
            onDestroy(id);
          }}
        />
      )}

      {isExtendModalOpen && (
        <ExtendExperimentModal
          experiment={experiment}
          onClose={() => setIsExtendModalOpen(false)}
          onConfirm={async (id, duration) => {
            const error = await onExtend(id, duration);
            if (!error) setIsExtendModalOpen(false);
            return error;
          }}
        />
      )}

    </div>
  );
}