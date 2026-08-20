import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, DatabasePlus, CloudUpload, Clock, ArrowRight } from 'lucide-react';

import PageLayout from '../components/PageLayout';
import { STATUS, formatTimeLeft, isExpiringSoon } from './Experiments/experimentStatus';

const API = 'http://localhost:3000/api';

// ==========================================
// HOME PAGE
// ==========================================
// È la prima pagina che si vede entrando, quindi ha due compiti: spiegare il
// modello di funzionamento a chi non lo conosce, e dare lo stato corrente a
// chi lo conosce già.
//
// La sequenza in tre passi comunica la separazione fra composizione e
// materializzazione, che è il principio su cui poggia l'intera piattaforma.

export default function HomePage() {
  const [experiments, setExperiments] = useState([]);
  const [resources, setResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const expRes = await fetch(`${API}/experiments`);
        if (!expRes.ok) throw new Error();
        const experimentList = await expRes.json();
        setExperiments(experimentList);

        // Non esiste un elenco globale delle risorse: `slices bi list` richiede
        // obbligatoriamente --experiment, e la piattaforma rispecchia il
        // vincolo. La vista d'insieme si costruisce quindi iterando sugli
        // esperimenti, che è esattamente ciò che la CLI non fa per te.
        const lists = await Promise.all(
          experimentList.map((exp) =>
            fetch(`${API}/resources?experimentId=${exp.id}`)
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          )
        );

        setResources(lists.flat());
      } catch {
        // Silenzioso: la Home resta leggibile anche senza dati, perché la
        // parte esplicativa non dipende dal backend.
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  // ==========================================
  // CONTEGGI
  // ==========================================
  const drafts = experiments.filter((e) => e.status === STATUS.DRAFT);
  const deployed = experiments.filter((e) => e.status === STATUS.DEPLOYED);

  const activeResources = resources.filter(
    (r) => r.status === STATUS.DEPLOYED && !r.isExpired
  );

  // Su una piattaforma dove ogni risorsa ha vita limitata e il default è di
  // poche ore, sapere cosa sta per sparire è l'informazione più utile che una
  // schermata iniziale possa dare. La CLI non avvisa di nulla: bisogna
  // ricordarsi di controllare.
  const expiring = activeResources
    .filter((r) => isExpiringSoon(r.remote.expiresAt))
    .sort((a, b) => new Date(a.remote.expiresAt) - new Date(b.remote.expiresAt));

  // ==========================================
  // COMPONENTI INTERNI
  // ==========================================

  const Step = ({ number, Icon, title, description }) => (
    <div className="flex-1 p-6 bg-white border border-gray-200 rounded-2xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
          {number}
        </span>
        <Icon size={18} className="text-gray-400" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );

  const Stat = ({ label, value, to, urgent = false }) => (
    <Link
      to={to}
      className="flex-1 p-6 bg-white border border-gray-200 rounded-2xl hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <p className={`text-4xl font-extrabold tracking-tight ${
        urgent && value > 0 ? 'text-rose-600' : 'text-gray-900'
      }`}>
        {isLoading ? '—' : value}
      </p>
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2 group-hover:text-gray-600 transition-colors">
        {label}
      </p>
    </Link>
  );

  return (
    <PageLayout topPadding="pt-0" layoutClass="pb-8 overflow-y-auto no-scrollbar">
      <div className="animate-in fade-in duration-300">

        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          Overview
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w">
          Compose experiments and their resources as reusable specifications,
          then materialize them on the SLICES-RI research infrastructure.
        </p>

        {/* ==========================================
            IL MODELLO IN TRE PASSI
            ========================================== */}
        <section className="mb-14">
          <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-6">
            How it works
          </h3>

          <div className="flex flex-col md:flex-row gap-4">
            <Step
              number="1"
              Icon={FileText}
              title="Compose"
              description="Create an experiment as a draft. It exists only in the platform, costs nothing and can be edited freely."
            />
            <Step
              number="2"
              Icon={DatabasePlus}
              title="Add resources"
              description="Define the virtual or bare metal machines the experiment needs. Still nothing is allocated."
            />
            <Step
              number="3"
              Icon={CloudUpload}
              title="Deploy"
              description="Materialize the whole experiment on SLICES-RI with a single action, and follow the allocation as it happens."
            />
          </div>

          <p className="text-sm text-black font-normal mt-6 max-w leading-relaxed">
            Resources on SLICES-RI have a limited lifetime and are released when they
            expire. The specification stays in the platform, so an experiment can be
            reviewed and repeated after its machines are gone.
          </p>
        </section>

        {/* ==========================================
            STATO CORRENTE
            ========================================== */}
        <section className="mb-14">
          <h3 className="text-sm font-bold text-black uppercase tracking-widest mb-6">
            Current state
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <Stat label="Drafts" value={drafts.length} to="/experiments" />
            <Stat label="Deployed experiments" value={deployed.length} to="/experiments" />
            <Stat label="Active resources" value={activeResources.length} to="/resources" />
            <Stat label="Expiring soon" value={expiring.length} to="/resources" urgent />
          </div>
        </section>

        {/* ==========================================
            AVVISO DI SCADENZA
            ==========================================
            Compare solo quando serve. È la funzionalità che meglio giustifica
            l'esistenza di un'interfaccia: la CLI non segnala nulla. */}
        {expiring.length > 0 && (
          <section className="mb-14">
            <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={18} className="text-amber-600" />
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">
                  Expiring within the hour
                </h3>
              </div>

              <ul className="space-y-2">
                {expiring.map((resource) => (
                  <li key={resource.id} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-amber-900">
                      {resource.spec.name}
                    </span>
                    <span className="font-bold text-amber-700">
                      {formatTimeLeft(resource.remote.expiresAt)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                to="/resources"
                className="inline-flex items-center gap-2 text-sm font-bold text-amber-800 mt-5 hover:gap-3 transition-all"
              >
                Go to Resources
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
            </div>
          </section>
        )}

        {/* ==========================================
            CONTESTO
            ==========================================
            Il progetto è stato di sessione della CLI, impostato una volta con
            `slices project use`. È configurazione della piattaforma, non una
            scelta dell'utente: dichiararlo evita di promettere un controllo
            che non esiste. */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-black font-bold">
              SLICES-RI project:{' '}
              <span className="font-mono font-semibold text-blue-500">tesi-unibo</span>
            </p>
            <p className="text-sm text-black font-bold">
              Site: <span className="font-mono font-semibold text-blue-500">be-gent1</span>
            </p>
          </div>
        </section>

      </div>
    </PageLayout>
  );
}