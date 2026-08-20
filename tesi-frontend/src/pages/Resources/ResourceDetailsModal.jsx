import { useState } from 'react';
import { X, Copy, Check, ExternalLink, Terminal } from 'lucide-react';

import StatusBadge from '../Experiments/StatusBadge';
import { formatDateTime, formatTimeLeft, isExpiringSoon } from '../Experiments/experimentStatus';
import { formatFlavor, kindLabel, buildSshCommand } from './resourceHelpers';

// ==========================================
// RESOURCE DETAILS MODAL
// ==========================================
// Vista completa di una risorsa. Corrisponde a `slices bi show`, ma mostra
// anche le risorse che su SLICES non esistono ancora.
//
// La sezione dei dati remoti compare solo dopo la materializzazione: prima
// del deploy non c'è alcun indirizzo, alcuna scadenza, alcuna console.

export default function ResourceDetailsModal({ resource, onClose }) {
  const [copied, setCopied] = useState(false);

  const { spec, remote, flavorDetails } = resource;
  const sshCommand = buildSshCommand(remote.sshLogin);

  const handleCopy = () => {
    navigator.clipboard.writeText(sshCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Riga di metadato. Il valore in monospazio serve per gli identificatori e
  // gli indirizzi, dove le cifre allineate riducono gli errori di lettura.
  const Field = ({ label, value, mono = false, urgent = false }) => (
    <div className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
        {label}
      </p>
      <p className={`text-sm font-semibold break-all ${mono ? 'font-mono text-xs' : ''} ${urgent ? 'text-rose-600' : 'text-black'}`}>
        {value ?? '—'}
      </p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-start justify-between p-8 pb-6 shrink-0 border-b border-gray-100">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold text-black tracking-tight truncate">
              {spec.name}
            </h2>
            <div className="flex items-center gap-3 mt-3">
              <StatusBadge status={resource.status} />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {kindLabel(spec.kind)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer shrink-0"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-8 flex-1 space-y-8 overflow-y-auto no-scrollbar">

          {/* SPECIFICA: cosa l'utente ha dichiarato */}
          <section>
            <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-4">
              Specification
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Site" value={spec.infra} mono />
              <Field label="Disk image" value={spec.image} />
              <div className="sm:col-span-2">
                <Field
                  label="Flavor"
                  value={
                    flavorDetails
                      ? `${spec.flavor} — ${formatFlavor(flavorDetails)}`
                      : spec.flavor
                  }
                />
              </div>
              <Field
                label="Public IPv4"
                value={spec.publicIpv4 ? 'Requested' : 'Not requested'}
              />
            </div>
          </section>

          {/* DATI SLICES: presenti solo dopo la materializzazione */}
          {remote.resourceId && (
            <section>
              <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-4">
                SLICES-RI
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Field label="Resource ID" value={remote.resourceId} mono />
                </div>
                <Field label="State" value={remote.slicesStatus} />
                <Field label="Private IPv4" value={remote.privateIpv4} mono />
                <Field label="Public IPv4" value={remote.publicIpv4} mono />
                <Field label="Created" value={formatDateTime(remote.createdAt)} />
                <Field label="Expires" value={formatDateTime(remote.expiresAt)} />
                <Field
                  label="Time left"
                  value={formatTimeLeft(remote.expiresAt)}
                  urgent={isExpiringSoon(remote.expiresAt)}
                />
              </div>
            </section>
          )}

          {/* ACCESSO
              La piattaforma si ferma al confine giusto: prepara l'accesso ma
              non lo fornisce. La chiave privata dell'utente non lascia mai il
              suo computer, quindi il terminale resta il suo strumento. */}
          {sshCommand && (
            <section>
              <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-4">
                Access
              </h3>

              <div className="flex items-center gap-3 p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                <Terminal size={18} className="text-gray-400 shrink-0" />
                <code className="text-xs font-mono text-black flex-1 truncate" title={sshCommand}>
                  {sshCommand}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shrink-0 cursor-pointer"
                  title="Copy command"
                >
                  {copied
                    ? <Check size={14} className="text-emerald-500" />
                    : <Copy size={14} className="text-gray-600" />}
                </button>
              </div>

              {/* Il salto attraverso il bastion spiega perché il comando
                  contiene un host che l'utente non ha mai richiesto. */}
              {remote.sshLogin?.jumpProxy && (
                <p className="text-xs text-gray-400 mt-3">
                  This machine has no public address. The connection passes through the
                  infrastructure bastion host{' '}
                  <span className="font-mono">{remote.sshLogin.jumpProxy.host}</span>.
                </p>
              )}
            </section>
          )}

          {/* ERRORE */}
          {remote.failureReason && (
            <section>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                <p className="text-sm font-bold text-rose-700">Provisioning failed</p>
                <p className="text-sm text-rose-600 mt-1">{remote.failureReason}</p>
              </div>
            </section>
          )}
        </div>

        {/* AZIONI */}
        {remote.consoleUrl && (
          <div className="px-8 py-5 flex justify-end border-t border-gray-100 shrink-0">
            <a
              href={remote.consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 text-sm font-bold text-black bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <ExternalLink size={16} />
              Open console
            </a>
          </div>
        )}

      </div>
    </div>
  );
}