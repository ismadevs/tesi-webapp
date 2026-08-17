import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { CloudUpload, Boxes, Clock, Database } from 'lucide-react';

import PageLayout from '../../components/PageLayout';
import StatusBadge from '../Experiments/StatusBadge';
import { STATUS } from '../Experiments/experimentStatus';

const API_URL = 'http://localhost:3000/api/experiments';

// Stati transitori: finché almeno un esperimento si trova in uno di questi,
// l'interfaccia continua a interrogare il backend per seguire l'evoluzione.
const TRANSIENT = [STATUS.DEPLOY_REQUESTED, STATUS.DEPLOYING];

// ==========================================
// DEPLOY PAGE
// ==========================================
// Materializza su SLICES-RI gli esperimenti composti nella piattaforma.
//
// Il pulsante non invoca la CLI e non attende il provisioning: scrive una
// richiesta e ritorna subito. È l'orchestratore lato backend a raccoglierla
// e ad agire, e l'interfaccia segue l'evoluzione dello stato.

export default function DeployPage() {
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deployingIds, setDeployingIds] = useState(new Set());

  // Conserva l'identificatore dell'intervallo per poterlo interrompere
  // quando non ci sono più operazioni in corso.
  const pollRef = useRef(null);

  const fetchExperiments = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error();
      setExperiments(await response.json());
    } catch {
      toast.error('Cannot reach the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  // ==========================================
  // POLLING CONDIZIONATO
  // ==========================================
  // Attivo solo mentre c'è qualcosa in movimento. Interrogare di continuo un
  // elenco fermo sarebbe spreco, e con CouchDB questo blocco sparirà del tutto:
  // il changes feed notifica i cambiamenti invece di richiedere interrogazioni.
  useEffect(() => {
    const hasPending = experiments.some((exp) => TRANSIENT.includes(exp.status));

    if (hasPending && !pollRef.current) {
      pollRef.current = setInterval(fetchExperiments, 2000);
    } else if (!hasPending && pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [experiments]);

  const handleDeploy = async (experiment) => {
    setDeployingIds((prev) => new Set(prev).add(experiment.id));

    try {
      const response = await fetch(`${API_URL}/${experiment.id}/deploy`, {
        method: 'POST',
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        toast.error(body.message || 'Unable to request the deployment.');
        return;
      }

      toast.success(`Deployment requested for ${experiment.spec.name}.`);
      fetchExperiments();
    } catch {
      toast.error('Cannot reach the server.');
    } finally {
      setDeployingIds((prev) => {
        const next = new Set(prev);
        next.delete(experiment.id);
        return next;
      });
    }
  };

  // Materializzabili: le bozze e quelle fallite, che si possono ritentare.
  const deployable = experiments.filter(
    (exp) => exp.status === STATUS.DRAFT || exp.status === STATUS.FAILED
  );

  const inProgress = experiments.filter((exp) => TRANSIENT.includes(exp.status));

  // ==========================================
  // SCHEDA DI UN ESPERIMENTO
  // ==========================================
  const ExperimentCard = ({ experiment, actionable }) => {
    const isBusy = deployingIds.has(experiment.id);

    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-bold text-gray-900 truncate">
              {experiment.spec.name}
            </h3>
            <StatusBadge status={experiment.status} />
          </div>

          <div className="flex items-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {experiment.spec.duration}
            </span>
            <span className="flex items-center gap-1.5">
              <Database size={14} />
              {experiment.resourceCount ?? 0} resources
            </span>
          </div>

          {experiment.status === STATUS.FAILED && experiment.error && (
            <p className="text-sm text-rose-600 mt-3">{experiment.error}</p>
          )}
        </div>

        {actionable && (
          <button
            onClick={() => handleDeploy(experiment)}
            disabled={isBusy}
            className="shrink-0 flex items-center justify-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CloudUpload size={16} strokeWidth={2.5} />
            {experiment.status === STATUS.FAILED ? 'Retry' : 'Deploy'}
          </button>
        )}
      </div>
    );
  };

  const EmptyState = ({ message }) => (
    <div className="flex items-center gap-3 text-gray-400 p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
      <Boxes size={20} />
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  return (
    <PageLayout topPadding="pt-0" layoutClass="pb-8 overflow-y-auto">
      <div className="animate-in fade-in duration-300">

        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          Deploy
        </h2>
        <p className="text-lg text-gray-600 mb-12">
          Materialize your draft experiments on the SLICES-RI infrastructure
        </p>

        {isLoading ? (
          <div className="flex justify-center items-center text-gray-500 gap-3 mt-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="font-medium">Loading...</p>
          </div>
        ) : (
          <>
            {/* IN CORSO: compare solo quando c'è qualcosa in movimento */}
            {inProgress.length > 0 && (
              <section className="mb-12">
                <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-6">
                  In progress
                </h3>
                <div className="flex flex-col gap-4">
                  {inProgress.map((exp) => (
                    <ExperimentCard key={exp.id} experiment={exp} actionable={false} />
                  ))}
                </div>
              </section>
            )}

            {/* PRONTI AL DEPLOY */}
            <section>
              <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-6">
                Ready to deploy
              </h3>

              {deployable.length === 0 ? (
                <EmptyState message="No drafts waiting to be deployed." />
              ) : (
                <div className="flex flex-col gap-4">
                  {deployable.map((exp) => (
                    <ExperimentCard key={exp.id} experiment={exp} actionable />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </PageLayout>
  );
}