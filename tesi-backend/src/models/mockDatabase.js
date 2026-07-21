import Resource from './Resource.js';
import Experiment from './Experiment.js'; // (O il file corrispondente che hai per gli esperimenti)

// ==========================================
// MOCK DATABASE: RISORSE SLICES-RI
// ==========================================
export let mockResources = [
  new Resource({
    id: 1,
    name: "telecontrol-backend-baremetal",
    experiment: 101,
    siteId: "be-gent1-bi-baremetal1",
    diskImage: "Ubuntu 24.04.3",
    flavor: "pcgen07",
    duration: "1d",
    count: 1,
    publicIpv4: true,
    sshKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEhKNN...",
    status: "up",
    createdAt: "2026-07-20T08:00:00Z"
  }),
  new Resource({
    id: 2,
    name: "react-ui-profiling-vm",
    experiment: 103,
    siteId: "be-gent1-bi-vm1",
    diskImage: "Debian 12.7",
    flavor: "m1.small",
    duration: "3h",
    count: 1,
    publicIpv4: false,
    sshKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEhKNN...",
    status: "up",
    createdAt: "2026-07-21T09:15:00Z"
  }),
  new Resource({
    id: 3,
    name: "aspnet-api-stress-node",
    experiment: 102,
    siteId: "be-gent1-bi-vm1",
    diskImage: "Ubuntu 24.04.1",
    flavor: "large",
    duration: "12h",
    count: 1,
    publicIpv4: true,
    sshKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEhKNN...",
    status: "starting",
    createdAt: "2026-07-21T17:30:00Z"
  }),
  new Resource({
    id: 4,
    name: "db-tree-structure-master",
    experiment: 104,
    siteId: "be-gent1-bi-baremetal1",
    diskImage: "Ubuntu 24.04.3",
    flavor: "pcgen08-gpu6000",
    duration: "2d",
    count: 1,
    publicIpv4: false,
    sshKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEhKNN...",
    status: "stopped",
    createdAt: "2026-07-18T10:00:00Z"
  }),
  new Resource({
    id: 5,
    name: "telecontrol-dns-proxy",
    experiment: 101,
    siteId: "be-gent1-bi-vm1",
    diskImage: "Debian 13.1",
    flavor: "tiny",
    duration: "3h",
    count: 1,
    publicIpv4: false,
    sshKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEhKNN...",
    status: "up",
    createdAt: "2026-07-21T14:20:00Z"
  })
];

// ==========================================
// L'ARRAY DEGLI ESPERIMENTI (Invariato)
// ==========================================
export let mockExperiments = [
  new Experiment({
    id: 101,
    name: "Telecontrol Simulator Load Test",
    description: "Stress test massivo sui nodi ad albero del simulatore di telecontrollo per valutare la latenza di risposta del backend.",
    status: "completed",
    createdAt: "2026-06-10T09:15:00Z",
    allocatedResources: [
      { resourceId: 1, type: "full" },
      { resourceId: 5, type: "namespace", namespaceName: "proxy-net" }
    ]
  }),
  new Experiment({
    id: 102,
    name: "ASP.NET Core API Benchmarking",
    description: "Valutazione dei tempi di risposta delle API REST in C# sotto un carico simulato di 10.000 richieste concorrenti al secondo.",
    status: "running",
    createdAt: "2026-07-18T14:30:00Z",
    allocatedResources: [
      { resourceId: 3, type: "full" }
    ]
  }),
  new Experiment({
    id: 103,
    name: "React Frontend Render Profiling",
    description: "Analisi delle performance di rendering dei componenti UI della dashboard con flusso dati in tempo reale via WebSocket.",
    status: "stopped",
    createdAt: "2026-07-19T11:10:00Z",
    allocatedResources: [
      { resourceId: 2, type: "full" }
    ]
  }),
  new Experiment({
    id: 104,
    name: "Tree-Structure DB Pathing Optimization",
    description: "Verifica dell'integrità logica e dei tempi di query sui percorsi ad albero gerarchici nel database principale.",
    status: "running",
    createdAt: "2026-07-20T08:45:00Z",
    allocatedResources: [
      { resourceId: 4, type: "full" }
    ]
  }),
  new Experiment({
    id: 105,
    name: "Failover Protocol Rehearsal",
    description: "Simulazione di caduta improvvisa del nodo master per verificare i tempi di ripristino automatico e la resilienza dei dati.",
    status: "stopped",
    createdAt: "2026-07-15T16:20:00Z",
    allocatedResources: []
  })
];