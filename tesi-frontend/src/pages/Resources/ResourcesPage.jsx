import PageLayout from '../../components/PageLayout';
import TopBar from './TopBar';
// Importiamo il nostro nuovo mattoncino! Assicurati che il percorso sia corretto.
import ResourceCard from './ResourceCard';

// ==========================================
// MOCK DATA: Simuliamo la risposta del database
// ==========================================
const mockSites = [
  {
    id: "srv-001",
    name: "Telecontrol Gateway",
    status: "online",
    compute: { cpuCores: 8, ramGB: 16, storageTB: 0.5 },
    tech: { hostingType: "Docker", os: "Ubuntu 24.04", ipAddress: "192.168.1.10" },
    lastPing: "2026-07-02T19:30:00Z"
  },
  {
    id: "srv-002",
    name: "Keycloak Auth Node",
    status: "online",
    compute: { cpuCores: 4, ramGB: 8, storageTB: 0.2 },
    tech: { hostingType: "Kubernetes", os: "Debian 12", ipAddress: "10.0.0.55" },
    lastPing: "2026-07-02T19:34:00Z"
  },
  {
    id: "srv-003",
    name: "CouchDB Master",
    status: "maintenance",
    compute: { cpuCores: 16, ramGB: 32, storageTB: 2.0 },
    tech: { hostingType: "Docker", os: "Ubuntu 22.04", ipAddress: "192.168.1.20" },
    lastPing: "2026-07-02T18:15:00Z"
  },
  {
    id: "srv-004",
    name: "Postgres Analytics",
    status: "offline",
    compute: { cpuCores: 32, ramGB: 128, storageTB: 10.0 },
    tech: { hostingType: "Bare Metal", os: "RHEL 9", ipAddress: "172.16.0.100" },
    lastPing: "2026-07-01T23:59:00Z"
  },
  {
    id: "srv-002",
    name: "Keycloak Auth Node",
    status: "online",
    compute: { cpuCores: 4, ramGB: 8, storageTB: 0.2 },
    tech: { hostingType: "Kubernetes", os: "Debian 12", ipAddress: "10.0.0.55" },
    lastPing: "2026-07-02T19:34:00Z"
  },
  {
    id: "srv-003",
    name: "CouchDB Master",
    status: "maintenance",
    compute: { cpuCores: 16, ramGB: 32, storageTB: 2.0 },
    tech: { hostingType: "Docker", os: "Ubuntu 22.04", ipAddress: "192.168.1.20" },
    lastPing: "2026-07-02T18:15:00Z"
  },
  {
    id: "srv-004",
    name: "Postgres Analytics",
    status: "offline",
    compute: { cpuCores: 32, ramGB: 128, storageTB: 10.0 },
    tech: { hostingType: "Bare Metal", os: "RHEL 9", ipAddress: "172.16.0.100" },
    lastPing: "2026-07-01T23:59:00Z"
  }
];

export default function ResourcesPage(){
  return (
    // Passiamo topPadding="mt-0"
    // Bloccato lo scroll standard del layout con overflow-hidden
    <PageLayout topPadding="pt-0" layoutClass="overflow-hidden">
      
      {/* min-h-0 è il segreto: dice a questo div di non ingrandirsi a dismisura e di adattarsi al PageLayout */}
      <div className="flex flex-col h-full min-h-0 animate-in fade-in duration-300">
        
        {/* TOP BAR FISSA IN ALTO */}
        {/* shrink-0 le impedisce categoricamente di venire schiacciata se ci sono troppe card */}
        <div className="shrink-0">
          <TopBar />
        </div>

        {/* IL FEED DELLE CARD (L'unica cosa che può scrollare!) */}
        <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {mockSites.map((site) => (
              <ResourceCard key={site.id} site={site} />
            ))}
            
          </div>
        </div>

      </div>
    </PageLayout>
  );
}