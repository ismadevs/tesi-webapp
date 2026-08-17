import PageLayout from '../../components/PageLayout';

// ==========================================
// DEPLOY PAGE
// ==========================================
// Sezione in cui l'utente materializza su SLICES-RI gli esperimenti composti
// nelle sezioni precedenti. Per ora è un segnaposto: serve a verificare che
// la rotta e la voce di sidebar funzionino prima di costruirne il contenuto.

export default function DeployPage() {
  return (
    <PageLayout topPadding="pt-0" layoutClass="pb-8 overflow-y-auto">
      <div className="animate-in fade-in duration-300">

        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-4">
          Deploy
        </h2>

        <p className="text-lg text-gray-600 mb-12">
          Materialize your draft experiments on the SLICES-RI infrastructure
        </p>

        {/* Stato vuoto provvisorio. Verrà sostituito dall'elenco degli esperimenti
            in stato DRAFT, ciascuno con il riepilogo delle risorse che verranno
            allocate e il proprio pulsante di deploy. */}
        <div className="flex items-center gap-3 text-gray-400 p-6 bg-gray-50 rounded-2xl border border-gray-100 border-dashed">
          <p className="text-sm font-medium">
            Section under construction.
          </p>
        </div>

      </div>
    </PageLayout>
  );
}