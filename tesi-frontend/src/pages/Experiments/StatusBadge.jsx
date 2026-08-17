import { getStatusConfig } from './experimentStatus';

// ==========================================
// STATUS BADGE (Presentational Component)
// ==========================================
// Componente minimo condiviso da tabella e dettaglio. La variante `lg` cambia
// solo le proporzioni, non i colori: la stessa informazione deve avere lo
// stesso aspetto ovunque compaia.

export default function StatusBadge({ status, size = 'sm' }) {
  const config = getStatusConfig(status);

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