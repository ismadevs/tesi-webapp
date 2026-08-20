import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, DatabasePlus, CloudUpload, Clock, ArrowRight, ArrowUpRight } from 'lucide-react';

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

  // Il numero del passo è grande e in filigrana invece che dentro un pallino:
  // dà ritmo alla lettura senza aggiungere un elemento grafico in più.
  const Step = ({ number, Icon, title, description }) => (
    <div className="flex-1 relative p-6 bg-white border border-gray-200 rounded-2xl overflow-hidden group hover:border-gray-300 transition-colors">
      <span className="absolute -top-3 right-3 text-7xl font-extrabold text-gray-50 select-none pointer-events-none">
        {number}
      </span>

      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center mb-4">
          <Icon size={18} className="text-primary" strokeWidth={2.5} />
        </div>

        <h3 className="text-base font-bold text-gray-900 mb-1.5">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  // La freccia compare solo al passaggio del mouse: segnala che il riquadro
  // è cliccabile senza occupare spazio quando non serve.
  const Stat = ({ label, value, to, urgent = false }) => {
    const highlight = urgent && value > 0;

    return (
      <Link
        to={to}
        className={`flex-1 relative p-6 border rounded-2xl transition-all group ${
          highlight
            ? 'bg-rose-50/50 border-rose-100 hover:border-rose-200'
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}
      >
        <ArrowUpRight
          size={16}
          strokeWidth={2.5}
          className="absolute top-5 right-5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
        />

        <p className={`text-4xl font-extrabold tracking-tight tabular-nums ${
          highlight ? 'text-rose-600' : 'text-gray-900'
        }`}>
          {isLoading ? <span className="text-gray-200">—</span> : value}
        </p>

        <p className={`text-[11px] font-bold uppercase tracking-widest mt-2 transition-colors ${
          highlight ? 'text-rose-500' : 'text-gray-400 group-hover:text-gray-600'
        }`}>
          {label}
        </p>
      </Link>
    );
  };

  const SectionTitle = ({ children }) => (
    <div className="flex items-center gap-4 mb-6">
      <h3 className="text-sm font-bold text-black uppercase tracking-widest whitespace-nowrap">
        {children}
      </h3>
      {/* Filo sottile che prosegue fino al margine: separa le sezioni senza
          il peso di un bordo pieno. */}
      <div className="h-px bg-gray-100 flex-1" />
    </div>
  );

  return (
    <PageLayout topPadding="pt-0" layoutClass="pb-8 overflow-y-auto no-scrollbar">
      <div className="animate-in fade-in duration-300">

        {/* INTESTAZIONE */}
        <div className="mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
            Overview
          </h2>
          <p className="text-lg text-gray-600 max-w leading-relaxed">
            Compose experiments and their resources as reusable specifications,
            then materialize them on the{' '}
            <span className="text-gray-900 font-semibold">SLICES-RI</span>{' '}
            research infrastructure.
          </p>
        </div>

        {/* ==========================================
            IL MODELLO IN TRE PASSI
            ========================================== */}
        <section className="mb-14">
          <SectionTitle>How it works</SectionTitle>

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

          {/* Barra verticale invece del solo testo: lega la nota ai riquadri
              sopra e la distingue da un paragrafo qualsiasi. */}
          <div className="mt-6 pl-4 border-l-2 border-gray-100">
            <p className="text-sm text-gray-500 max-w leading-relaxed">
              Resources on SLICES-RI have a limited lifetime and are released when they
              expire. The specification stays in the platform, so an experiment can be
              reviewed, duplicated and repeated after its machines are gone.
            </p>
          </div>
        </section>

        {/* ==========================================
            STATO CORRENTE
            ========================================== */}
        <section className="mb-14">
          <SectionTitle>Current state</SectionTitle>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Drafts" value={drafts.length} to="/experiments" />
            <Stat label="Deployed" value={deployed.length} to="/experiments" />
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
            <div className="p-6 bg-amber-50/60 border border-amber-100 rounded-2xl">
              <div className="flex items-center gap-2.5 mb-5">
                <Clock size={16} className="text-amber-600" strokeWidth={2.5} />
                <h3 className="text-sm font-bold text-amber-800 uppercase tracking-widest">
                  Expiring within the hour
                </h3>
              </div>

              <ul className="divide-y divide-amber-100">
                {expiring.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex items-center justify-between py-2.5 text-sm first:pt-0"
                  >
                    <span className="font-semibold text-amber-900">
                      {resource.spec.name}
                    </span>
                    <span className="font-bold text-amber-700 tabular-nums">
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
        <section className="pt-6 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <p className="text-sm text-black font-bold">
              SLICES-RI project:{' '}
              <span className="font-mono font-semibold text-primary">tesi-unibo</span>
            </p>
            <p className="text-sm text-black font-bold">
              Site:{' '}
              <span className="font-mono font-semibold text-primary">be-gent1</span>
            </p>
          </div>
        </section>

      </div>
    </PageLayout>
  );
}