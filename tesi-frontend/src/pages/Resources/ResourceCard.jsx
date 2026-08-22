import { useState } from 'react';
import { MoreVertical, Info, Pencil, Trash2, Cpu, HardDrive, Globe, ExternalLink } from 'lucide-react';

import StatusBadge from '../Experiments/StatusBadge';
import {
  STATUS, formatTimeLeft, isExpiringSoon, formatDateTime,
} from '../Experiments/experimentStatus';
import { formatFlavor, kindLabel, PROVISIONING_STEPS, provisioningIndex } from './resourceHelpers';

// ==========================================
// RESOURCE CARD (Presentational Component)
// ==========================================
// La card ha tre volti a seconda dello stato.
//
// In bozza mostra la SPECIFICA, cioè cosa l'utente ha chiesto, e offre le
// azioni di modifica. Dopo il deploy mostra la REALTÀ, cioè cosa SLICES ha
// allocato. Dopo la distruzione resta come STORICO, attenuata.
//
// La card non sparisce mai: il documento sopravvive alla macchina, che è il
// principio su cui poggia l'intera piattaforma.

export default function ResourceCard({
  resource, editable, onOpenInfo, onEdit, onDelete, onDestroy,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { spec, remote, flavorDetails } = resource;

  const isDraft = resource.status === STATUS.DRAFT;
  const isDestroyed = resource.status === STATUS.DESTROYED;

  // Distruggibile solo ciò che esiste davvero su SLICES e non è già stato
  // liberato. Le due azioni sono distinte anche nel nome: Delete rimuove una
  // bozza dalla piattaforma, Destroy libera hardware reale.
  const destroyable = resource.status === STATUS.DEPLOYED && Boolean(remote.resourceId);
  const showMenu = editable || destroyable;

  // ==========================================
  // PROGRESSIONE DEL PROVISIONING
  // ==========================================
  // Quattro tappe invece di un indicatore generico. È informazione che la CLI
  // fornisce solo a chi sa interpretarla, e che qui diventa leggibile a colpo
  // d'occhio: si vede se la macchina sta copiando l'immagine, avviandosi
  // oppure configurandosi.
  const renderProvisioning = () => {
    const current = provisioningIndex(remote.slicesStatus);
    if (current < 0) return null;

    return (
      <div className="flex items-center gap-1.5 mt-4">
        {PROVISIONING_STEPS.map((step, index) => (
          <div key={step.key} className="flex-1" title={step.description}>
            <div
              className={`h-1 rounded-full transition-colors ${
                index < current
                  ? 'bg-emerald-400'
                  : index === current
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-gray-200'
              }`}
            />
            <p className={`text-[10px] mt-1 font-semibold ${
              index === current ? 'text-emerald-600' : 'text-gray-300'
            }`}>
              {step.label}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // ==========================================
  // INFORMAZIONE TEMPORALE
  // ==========================================
  // Tre casi con cause diverse, quindi tre rappresentazioni diverse.
  // Distrutta significa che qualcuno l'ha liberata, scaduta che è finito il
  // tempo: confonderle nasconderebbe cosa è realmente accaduto.
  const renderTiming = () => {
    if (isDestroyed) {
      return (
        <span className="text-xs font-semibold text-gray-400">
          {remote.terminatedAt
            ? `Released ${formatDateTime(remote.terminatedAt)}`
            : 'Released'}
        </span>
      );
    }

    if (resource.isExpired) {
      return <span className="text-xs font-semibold text-gray-400">Expired</span>;
    }

    if (remote.expiresAt) {
      return (
        <span className={`text-xs font-semibold ${
          isExpiringSoon(remote.expiresAt) ? 'text-rose-600' : 'text-gray-400'
        }`}>
          {formatTimeLeft(remote.expiresAt)} left
        </span>
      );
    }

    return null;
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 transition-all duration-300 flex flex-col h-full ${
      isDestroyed ? 'opacity-60' : 'hover:shadow-lg hover:shadow-gray-100/50'
    }`}>

      {/* HEADER: nome e menu azioni */}
      <div className="flex justify-between items-start mb-4 gap-3">
        <div className="min-w-0">
          <h3 className={`text-lg font-bold tracking-tight truncate ${
            isDestroyed ? 'text-gray-500 line-through' : 'text-black'
          }`} title={spec.name}>
            {spec.name}
          </h3>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            {kindLabel(spec.kind)}
          </p>
        </div>

        {showMenu && (
          <div className="relative shrink-0">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 -mt-1 -mr-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <MoreVertical size={18} strokeWidth={2.5} />
            </button>

            {isMenuOpen && (
              <>
                {/* Sfondo invisibile che cattura il click fuori dal menu */}
                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-20 py-1 overflow-hidden">

                  {/* Solo sulle bozze: modificare una specifica già applicata
                      non avrebbe alcun effetto sull'hardware allocato. */}
                  {editable && (
                    <>
                      <button
                        onClick={() => { onEdit(resource); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        onClick={() => { onDelete(resource); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Trash2 size={14} /> Delete draft
                      </button>
                    </>
                  )}

                  {/* Solo sulle allocate: libera hardware reale. */}
                  {destroyable && (
                    <button
                      onClick={() => { onDestroy(resource); setIsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={14} /> Destroy
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* SPECIFICA: sempre presente, è ciò che l'utente ha dichiarato e
          resta leggibile anche dopo che la macchina è stata liberata */}
      <div className="flex flex-col gap-2.5 mb-auto">
        <p className="text-sm text-gray-600 flex items-start gap-2.5">
          <Cpu size={16} strokeWidth={2.5} className="text-gray-400 shrink-0 mt-0.5" />
          <span>
            <span className="font-semibold text-black">{spec.flavor}</span>
            {flavorDetails && formatFlavor(flavorDetails) && (
              <span className="block text-xs text-gray-500 mt-0.5">
                {formatFlavor(flavorDetails)}
              </span>
            )}
          </span>
        </p>

        <p className="text-sm text-gray-600 flex items-center gap-2.5">
          <HardDrive size={16} strokeWidth={2.5} className="text-gray-400 shrink-0" />
          <span className="font-semibold text-black">{spec.image}</span>
        </p>

        {/* L'indirizzo pubblico compare solo se richiesto: è l'unico parametro
            di rete che l'utente controlla, e senza di esso la macchina non è
            raggiungibile direttamente da internet. */}
        {spec.publicIpv4 && !isDestroyed && (
          <p className="text-sm text-gray-600 flex items-center gap-2.5">
            <Globe size={16} strokeWidth={2.5} className="text-gray-400 shrink-0" />
            <span className="font-semibold text-black">
              {remote.publicIpv4 || 'Public IPv4 requested'}
            </span>
          </p>
        )}
      </div>

      {!isDraft && !isDestroyed && renderProvisioning()}

      {/* FOOTER: stato, informazione temporale e azioni di sola lettura */}
      <div className="flex justify-between items-end mt-5 pt-4 border-t border-gray-100">
        <div className="flex flex-col gap-2">
          <StatusBadge status={resource.status} expired={resource.isExpired} />
          {renderTiming()}
        </div>

        <div className="flex items-center gap-1">
          {/* La console web è fornita da SLICES: è una funzionalità che la CLI
              non offre e che l'interfaccia espone senza implementare nulla.
              Su una macchina liberata non ha più senso. */}
          {remote.consoleUrl && !isDestroyed && (
            <a
              href={remote.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              title="Open console"
            >
              <ExternalLink size={18} strokeWidth={2.5} />
            </a>
          )}

          <button
            onClick={() => onOpenInfo(resource)}
            className="p-1.5 -mb-0.5 -mr-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            title="View details"
          >
            <Info size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>

    </div>
  );
}