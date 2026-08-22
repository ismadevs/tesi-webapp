import { getStatusConfig } from './experimentStatus';

// ==========================================
// STATUS BADGE (Presentational Component)
// ==========================================
// Componente minimo condiviso da tabella, dettaglio e card delle risorse.
// La variante `lg` cambia solo le proporzioni, non i colori: la stessa
// informazione deve avere lo stesso aspetto ovunque compaia.
//
// LA SCADENZA NON È UNO STATO
// Nessuno la scrive nel documento: è una condizione che si verifica al
// passare del tempo, derivata alla lettura confrontando expiresAt con l'ora
// corrente. Arriva quindi come flag separato invece che dentro `status`.
//
// Quando è vera prevale sulla rappresentazione di DEPLOYED: le macchine sono
// già state liberate dall'infrastruttura, e mostrarle in verde sarebbe
// fuorviante. Resta però distinta da DESTROYED, che indica una liberazione
// deliberata dell'utente: sono cause diverse dello stesso esito.

const EXPIRED_CONFIG = {
  label: 'Expired',
  text: 'text-gray-500',
  bg: 'bg-gray-50',
  border: 'border-gray-200',
  dot: 'bg-gray-300',
  pulse: false,
};

export default function StatusBadge({ status, expired = false, size = 'sm' }) {
  const config = expired ? EXPIRED_CONFIG : getStatusConfig(status);

  const sizeClasses = size === 'lg'
    ? 'text-sm px-3 py-1.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-2 font-semibold rounded-md border w-fit
                  ${config.text} ${config.bg} ${config.border} ${sizeClasses}`}
    >
      <span
        className={`w-2 h-2 rounded-full ${config.dot} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}