import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, ChevronDown, Boxes, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

import PageLayout from '../../components/PageLayout';
import StatusBadge from '../Experiments/StatusBadge';
import { STATUS } from '../Experiments/experimentStatus';

import ResourceCard from './ResourceCard';
import ResourceFormModal from './ResourceFormModal';
import ResourceDetailsModal from './ResourceDetailsModal';
import DeleteResourceModal from './DeleteResourceModal';
import DestroyResourceModal from './DestroyResourceModal';

const API = 'http://localhost:3000/api';

// Stati in cui qualcosa si sta muovendo sull'infrastruttura. Finché almeno
// una risorsa si trova in uno di questi, l'interfaccia continua a interrogare
// il backend per seguire l'evoluzione.
const TRANSIENT = [
  STATUS.DEPLOY_REQUESTED,
  STATUS.DEPLOYING,
  STATUS.DESTROY_REQUESTED,
  STATUS.DESTROYING,
];

// ==========================================
// CONTAINER COMPONENT - RESOURCES PAGE
// ==========================================
// La sezione è AMBITA A UN ESPERIMENTO, non globale.
//
// Non è una scelta estetica: `slices bi list` richiede obbligatoriamente
// --experiment e non esiste modo di elencare le proprie risorse globalmente.
// Una vista globale non avrebbe corrispondenza nella piattaforma, e
// suggerirebbe che le risorse siano oggetti riutilizzabili da spostare fra
// esperimenti, cosa che in SLICES non è possibile.

export default function ResourcesPage() {
  const [experiments, setExperiments] = useState([]);
  const [resources, setResources] = useState([]);
  const [catalog, setCatalog] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // null = chiusa, 'new' = creazione, oggetto = modifica
  const [formTarget, setFormTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [destroyTarget, setDestroyTarget] = useState(null);

  const selectedExperiment = experiments.find((e) => e.id === selectedId) ?? null;

  // Le risorse sono modificabili solo finché l'esperimento contenitore è in
  // bozza: dopo la materializzazione l'hardware è già stato allocato.
  const editable = selectedExperiment?.status === STATUS.DRAFT;

  const readError = async (response, fallback) => {
    try {
      const body = await response.json();
      return body.message || fallback;
    } catch {
      return fallback;
    }
  };

  // ==========================================
  // CARICAMENTO INIZIALE
  // ==========================================
  useEffect(() => {
    const load = async () => {
      try {
        const [expRes, catRes] = await Promise.all([
          fetch(`${API}/experiments`),
          fetch(`${API}/resources/catalog`),
        ]);

        if (!expRes.ok || !catRes.ok) throw new Error();

        const experimentList = await expRes.json();
        setExperiments(experimentList);
        setCatalog(await catRes.json());

        // Preseleziona la prima bozza, che è il caso d'uso più frequente:
        // si entra in questa sezione per aggiungere risorse a un esperimento
        // che si sta ancora componendo.
        const firstDraft = experimentList.find((e) => e.status === STATUS.DRAFT);
        setSelectedId((firstDraft ?? experimentList[0])?.id ?? null);
      } catch {
        toast.error('Cannot reach the server.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // ==========================================
  // RISORSE DELL'ESPERIMENTO SELEZIONATO
  // ==========================================
  const fetchResources = async (experimentId) => {
    if (!experimentId) {
      setResources([]);
      return;
    }

    try {
      const response = await fetch(`${API}/resources?experimentId=${experimentId}`);
      if (!response.ok) throw new Error();
      setResources(await response.json());
    } catch {
      toast.error('Cannot load resources.');
    }
  };

  // Ricarica gli esperimenti in sottofondo. Serve perché selectedExperiment
  // resterebbe altrimenti congelato al valore del caricamento iniziale, e il
  // banner verde non comparirebbe al termine del deploy.
  const refreshExperiments = async () => {
    try {
      const response = await fetch(`${API}/experiments`);
      if (response.ok) setExperiments(await response.json());
    } catch {
      // Silenzioso: è un aggiornamento di sfondo, un fallimento temporaneo
      // non deve disturbare l'utente con un messaggio.
    }
  };

  useEffect(() => {
    fetchResources(selectedId);
  }, [selectedId]);

  // ==========================================
  // POLLING CONDIZIONATO
  // ==========================================
  // Attivo solo mentre c'è qualcosa in movimento. È ciò che fa avanzare la
  // progressione del provisioning sulle card e che mostra il passaggio a
  // Destroyed senza ricaricare la pagina.
  //
  // Con CouchDB questo blocco sparirà: il changes feed notifica i cambiamenti
  // invece di richiedere interrogazioni periodiche.
    useEffect(() => {
      // Il polling deve attivarsi anche quando è l'ESPERIMENTO a muoversi:
      // le risorse restano DRAFT finché l'orchestratore non le prende in
      // carico, quindi guardare solo loro lascerebbe la pagina ferma per i
      // primi secondi dopo il deploy.
      const experimentPending =
        selectedExperiment && TRANSIENT.includes(selectedExperiment.status);
      const resourcesPending = resources.some((r) =>
        TRANSIENT.includes(r.status),
      );

      if (!experimentPending && !resourcesPending) return;

      const timer = setInterval(() => {
        fetchResources(selectedId);
        refreshExperiments();
      }, 3000);

      return () => clearInterval(timer);
    }, [resources, selectedExperiment, selectedId]);

  // ==========================================
  // MUTAZIONI
  // ==========================================
  const handleSave = async (payload) => {
    const isEditMode = formTarget !== 'new';
    const url = isEditMode ? `${API}/resources/${formTarget.id}` : `${API}/resources`;

    try {
      const response = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return await readError(response, 'Unable to save the resource.');
      }

      const saved = await response.json();

      setResources((prev) =>
        isEditMode
          ? prev.map((r) => (r.id === saved.id ? saved : r))
          : [...prev, saved]
      );

      setFormTarget(null);
      toast.success(isEditMode ? 'Resource updated.' : 'Resource added.');
    } catch {
      return 'Cannot reach the server.';
    }
  };

  // Rimuove il DOCUMENTO di una bozza. Su SLICES non esiste nulla, quindi non
  // succede altro. È operazione diversa da handleDestroy.
  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API}/resources/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        toast.error(await readError(response, 'Unable to delete the resource.'));
        return;
      }

      setResources((prev) => prev.filter((r) => r.id !== id));
      setDeleteTarget(null);
      toast.success('Draft deleted.');
    } catch {
      toast.error('Cannot reach the server.');
    }
  };

  // Libera HARDWARE REALE su SLICES. Il documento non sparisce dall'elenco:
  // resta come storico con stato DESTROYED, coerentemente con il principio
  // per cui la specifica sopravvive alla risorsa.
  //
  // La richiesta ritorna subito con 202: sarà l'orchestratore a invocare la
  // CLI, e il polling sopra seguirà l'evoluzione dello stato.
  const handleDestroy = async (id) => {
    try {
      const response = await fetch(`${API}/resources/${id}/destroy`, { method: 'POST' });

      if (!response.ok) {
        toast.error(await readError(response, 'Unable to destroy the resource.'));
        return;
      }

      const updated = await response.json();
      setResources((prev) => prev.map((r) => (r.id === id ? updated : r)));
      setDestroyTarget(null);
      toast.success('Destruction requested.');
    } catch {
      toast.error('Cannot reach the server.');
    }
  };

  const filtered = resources.filter((r) =>
    r.spec.name.toLowerCase().includes(search.toLowerCase())
  );

  // ==========================================
  // RENDERING
  // ==========================================
  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="animate-spin text-gray-300" size={28} />
        </div>
      );
    }

    // Stato vuoto primario: senza esperimenti non si può creare nulla, ed è
    // il primo punto in cui un utente nuovo può bloccarsi. La pagina indica
    // cosa fare invece di limitarsi a un pulsante disabilitato.
    if (experiments.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Boxes size={40} className="text-gray-300 mb-4" />
          <p className="text-lg font-semibold text-gray-600">No experiments yet</p>
          <p className="text-sm text-gray-400 mt-2 max-w-md">
            Resources live inside experiments and cannot exist on their own.
            Create an experiment first.
          </p>
          <Link
            to="/experiments"
            className="mt-6 flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Go to Experiments
            <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </div>
      );
    }

    if (resources.length === 0) {
      return (
        <div className="flex items-center gap-3 text-gray-400 p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
          <Boxes size={20} />
          <p className="text-sm font-medium">
            {editable
              ? 'No resources in this experiment yet. Add the first one.'
              : 'This experiment contains no resources.'}
          </p>
        </div>
      );
    }

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center gap-2 py-16">
          <p className="text-gray-400">No results for "{search}"</p>
          <button
            onClick={() => setSearch('')}
            className="text-sm text-primary font-semibold cursor-pointer"
          >
            Clear search
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            editable={editable}
            onOpenInfo={setDetailTarget}
            onEdit={setFormTarget}
            onDelete={setDeleteTarget}
            onDestroy={setDestroyTarget}
          />
        ))}
      </div>
    );
  };

  return (
    <PageLayout topPadding="pt-0" layoutClass="pb-8 overflow-y-auto">
      <div className="animate-in fade-in duration-300 flex flex-col h-full">

        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          Resources
        </h2>
        <p className="text-lg text-gray-600 mb-10">
          Define the machines that will be allocated inside an experiment
        </p>

        {/* SELETTORE DI ESPERIMENTO
            Il contesto è dichiarato una volta in alto, così le card non devono
            ripeterlo e la gerarchia della piattaforma resta visibile. */}
        {experiments.length > 0 && (
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <select
                value={selectedId ?? ''}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
              >
                {experiments.map((exp) => (
                  <option key={exp.id} value={exp.id}>
                    {exp.spec.name} — {exp.resourceCount ?? 0} resources
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            </div>

            {selectedExperiment && <StatusBadge status={selectedExperiment.status} />}

            <div className="flex items-center gap-3 lg:ml-auto">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-48"
              />

              {/* Il pulsante esiste solo se l'esperimento è in bozza */}
              {editable && (
                <button
                  onClick={() => setFormTarget('new')}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  New Resource
                </button>
              )}
            </div>
          </div>
        )}

        {/* Spiega l'assenza del pulsante invece di lasciarlo dedurre */}
        {selectedExperiment && !editable && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl mb-8">
            <p className="text-sm text-emerald-700">
              This experiment has been materialized on SLICES-RI. No resources can be
              added, but you can release the ones that are still running.
            </p>
          </div>
        )}

        <div className="flex-1 min-h-0">
          {renderBody()}
        </div>

        {formTarget && catalog && selectedExperiment && (
          <ResourceFormModal
            resource={formTarget === 'new' ? null : formTarget}
            experiment={selectedExperiment}
            catalog={catalog}
            onClose={() => setFormTarget(null)}
            onSave={handleSave}
          />
        )}

        {detailTarget && (
          <ResourceDetailsModal
            resource={detailTarget}
            onClose={() => setDetailTarget(null)}
          />
        )}

        {deleteTarget && (
          <DeleteResourceModal
            resource={deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onConfirm={handleDelete}
          />
        )}

        {destroyTarget && (
          <DestroyResourceModal
            resource={destroyTarget}
            onClose={() => setDestroyTarget(null)}
            onConfirm={handleDestroy}
          />
        )}

      </div>
    </PageLayout>
  );
}