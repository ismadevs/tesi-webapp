import { useState } from 'react';
import { X, AlertCircle, ChevronDown, Server, Cpu } from 'lucide-react';

// ==========================================
// RESOURCE FORM MODAL
// ==========================================
// Un solo componente per creazione e modifica, come per gli esperimenti.
//
// LA CASCATA
// La scelta del tipo determina il sito, e il sito determina quali flavor e
// quali immagini siano disponibili. I due cataloghi sono DISGIUNTI: nessun
// flavor esiste su entrambi i siti, e la stessa immagine può esistere su uno
// e non sull'altro. Cambiando tipo, i campi a valle vanno quindi azzerati e
// non lasciati con un valore ormai invalido.
//
// PERCHÉ SI CHIEDE IL TIPO E NON IL SITO
// SLICES non ha un parametro per il tipo di risorsa: lo deriva dal sito
// indicato con --infra. Qui si fa il percorso inverso, perché "Virtual
// machine" è il concetto che l'utente ha in mente, mentre
// `be-gent1-bi-vm1` non gli dice nulla. La traduzione avviene nel backend.

const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export default function ResourceFormModal({ resource, experiment, catalog, onClose, onSave }) {
  const isEditMode = Boolean(resource);

  const [kind, setKind] = useState(resource?.spec.kind ?? 'vm');
  const [name, setName] = useState(resource?.spec.name ?? '');
  const [flavor, setFlavor] = useState(resource?.spec.flavor ?? '');
  const [image, setImage] = useState(resource?.spec.image ?? '');
  const [publicIpv4, setPublicIpv4] = useState(resource?.spec.publicIpv4 ?? false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Il sito viene ricavato dal tipo consultando il catalogo, senza tabelle
  // di conversione scritte a mano nell'interfaccia.
  const infraEntry = catalog.infrastructures.find((i) => i.kind === kind);
  const infra = infraEntry?.infra;

  const availableFlavors = catalog.flavors[infra] ?? [];
  const availableImages = catalog.diskImages[infra] ?? [];

  // Cambiando tipo, i valori a valle non sono più validi.
  const handleKindChange = (nextKind) => {
    if (nextKind === kind) return;
    setKind(nextKind);
    setFlavor('');
    setImage('');
    setError('');
  };

  // Etichetta leggibile per un flavor: il nome da solo non dice nulla.
  // VM e baremetal hanno attributi diversi, quindi anche l'etichetta cambia.
  const flavorLabel = (f) => {
    const cpu = kind === 'baremetal' ? f.cpuTopology : `${f.vcpus} vCPU`;
    const parts = [cpu, `${f.ramGib} GiB`, `${f.rootDiskGb} GB`];
    if (f.gpu) parts.push(f.gpu);
    return `${f.name} — ${parts.join(', ')}`;
  };

  const validate = () => {
    const trimmed = name.trim();
    if (!trimmed) return 'Resource name is required.';
    if (!NAME_PATTERN.test(trimmed)) {
      return 'Use lowercase letters, digits and hyphens only (e.g. node-a).';
    }
    if (!flavor) return 'Select a flavor.';
    if (!image) return 'Select a disk image.';
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
      const serverError = await onSave({
        experimentId: experiment.id,
        spec: { name: name.trim(), kind, flavor, image, publicIpv4 },
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
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* HEADER */}
        <div className="flex items-start justify-between p-8 pb-6 shrink-0">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {isEditMode ? 'Edit resource' : 'New resource'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              In experiment <span className="font-semibold">{experiment.spec.name}</span>.
              Nothing is allocated until you deploy.
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

          {/* TIPO: primo campo, determina tutti gli altri */}
          <div>
            <label className={labelClass}>Type</label>
            <div className="grid grid-cols-2 gap-3">
              {catalog.infrastructures.map((entry) => {
                const isSelected = kind === entry.kind;
                const Icon = entry.kind === 'baremetal' ? Server : Cpu;

                return (
                  <button
                    key={entry.kind}
                    type="button"
                    onClick={() => handleKindChange(entry.kind)}
                    className={`p-4 border rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon size={18} className={isSelected ? 'text-primary' : 'text-gray-400'} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
                        {entry.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-snug">{entry.description}</p>
                    <p className="text-[11px] font-mono text-gray-400 mt-2">{entry.infra}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelClass}>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="node-a"
              autoFocus
              className={inputClass}
            />
            <p className="text-xs text-gray-400 mt-2">
              Lowercase letters, digits and hyphens. Unique within this experiment.
            </p>
          </div>

          {/* FLAVOR: filtrato dal tipo scelto sopra */}
          <div>
            <label className={labelClass}>Flavor</label>
            <div className="relative">
              <select
                value={flavor}
                onChange={(e) => setFlavor(e.target.value)}
                className={`${inputClass} appearance-none pr-10 cursor-pointer`}
              >
                <option value="">Select a flavor...</option>
                {availableFlavors.map((f) => (
                  <option key={f.name} value={f.name}>{flavorLabel(f)}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* IMMAGINE: anch'essa filtrata dal tipo */}
          <div>
            <label className={labelClass}>Disk image</label>
            <div className="relative">
              <select
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className={`${inputClass} appearance-none pr-10 cursor-pointer`}
              >
                <option value="">Select an image...</option>
                {availableImages.map((img) => (
                  <option key={img.name} value={img.name}>{img.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>
          </div>

          {/* IP PUBBLICO */}
          <div>
            <label className={labelClass}>Network</label>

            <label className="flex items-center gap-3 cursor-pointer group w-fit">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={publicIpv4}
                  onChange={(e) => setPublicIpv4(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${publicIpv4 ? 'bg-primary' : 'bg-gray-200'}`} />
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${publicIpv4 ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm font-semibold text-gray-700">Request a public IPv4</span>
            </label>

            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              Without a public address the machine is still reachable over SSH through the
              infrastructure bastion host. A public address is only needed to expose a
              service to the internet.
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
            {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Add resource'}
          </button>
        </div>

      </div>
    </div>
  );
}