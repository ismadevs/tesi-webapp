import ResourceSite from './ResourceSite.js';
import Experiment from './Experiment.js';

// Array siti di risorse
export let mockSites = [
  new ResourceSite({
    id: 1,
    name: "Main Research Cluster",
    resourceType: "kubernetes-cluster",
    status: "in-use",
    createdAt: "2026-07-02T18:42:00Z",
    connection: {
      ipAddress: "10.0.0.45",
      accessKey: "xK9vP2mQ5jR8tW1bN4cF"
    },
    spec: {
      k8sVersion: "v1.28.0",
      workerNodes: 5,
      nodeFlavor: "Large (8 Cores, 32GB RAM)"
    }
  }),
  new ResourceSite({
    id: 2,
    name: "Telecontrol Gateway",
    resourceType: "slices-vm",
    status: "online",
    createdAt: "2026-07-02T19:30:00Z",
    connection: {
      ipAddress: "192.168.1.10",
      accessKey: "yT7bC4nX9mP2vL8kR5wJ"
    },
    spec: {
      os: "Debian",
      cpuCores: 8,
      ramGB: 16,
      storageTB: 1.0
    }
  }),
  new ResourceSite({
    id: 3,
    name: "Data Science Node",
    resourceType: "slices-vm",
    status: "maintenance",
    createdAt: "2026-07-01T10:15:00Z",
    connection: {
      ipAddress: "172.16.0.100",
      accessKey: "pM3qW8cT1jF6vB9nL4zR"
    },
    spec: {
      os: "RHEL",
      cpuCores: 64,
      ramGB: 256,
      storageTB: 12.0
    }
  }),
  new ResourceSite({
    id: 4,
    name: "Edge Analytics",
    resourceType: "slices-vm",
    status: "offline",
    createdAt: "2026-06-30T23:59:00Z",
    connection: {
      ipAddress: "10.0.0.55",
      accessKey: "kL5vN2mX8bC9jP4tR7wQ"
    },
    spec: {
      os: "AlmaLinux",
      cpuCores: 4,
      ramGB: 8,
      storageTB: 1.0
    }
  }),
  new ResourceSite({
    id: 5,
    name: "Simulation Replica",
    resourceType: "kubernetes-cluster",
    status: "online",
    createdAt: "2026-07-02T19:40:00Z",
    connection: {
      ipAddress: "10.0.0.46",
      accessKey: "rW2bT7nC5mX8jP9vL4kF"
    },
    spec: {
      k8sVersion: "v1.27.3",
      workerNodes: 3,
      nodeFlavor: "Medium (4 Cores, 8GB RAM)"
    }
  }),
  new ResourceSite({
    id: 6,
    name: "Compute Nexus",
    resourceType: "slices-vm",
    status: "offline",
    createdAt: "2026-07-07T08:25:00Z",
    connection: {
      ipAddress: "10.0.0.58",
      accessKey: "hK9vP2mQ5jR8tW1bN4cF"
    },
    spec: {
      os: "Debian",
      cpuCores: 32,
      ramGB: 128,
      storageTB: 5.0
    }
  }),
  new ResourceSite({
    id: 7,
    name: "Machine Learning Worker A",
    resourceType: "slices-vm",
    status: "in-use",
    createdAt: "2026-07-08T09:15:00Z",
    connection: {
      ipAddress: "172.16.5.10",
      accessKey: "fH8vJ3mN5bC2xZ9pR4tW"
    },
    spec: {
      os: "Ubuntu",
      cpuCores: 128,
      ramGB: 1024,
      storageTB: 16.0
    }
  }),
  new ResourceSite({
    id: 8,
    name: "Machine Learning Worker B",
    resourceType: "slices-vm",
    status: "offline",
    createdAt: "2026-07-08T09:15:00Z",
    connection: {
      ipAddress: "172.16.5.11",
      accessKey: "mT4nP9vX2bC5jR8kL7wQ"
    },
    spec: {
      os: "Ubuntu",
      cpuCores: 128,
      ramGB: 1024,
      storageTB: 16.0
    }
  }),
  new ResourceSite({
    id: 9,
    name: "Frontend Load Balancer",
    resourceType: "kubernetes-cluster",
    status: "online",
    createdAt: "2026-07-08T10:05:00Z",
    connection: {
      ipAddress: "10.1.0.50",
      accessKey: "jP5vT8nC2mX4bZ9rW7kF"
    },
    spec: {
      k8sVersion: "v1.29.0",
      workerNodes: 2,
      nodeFlavor: "Small (2 Cores, 4GB RAM)"
    }
  }),
  new ResourceSite({
    id: 10,
    name: "Redis Cache Cluster",
    resourceType: "kubernetes-cluster",
    status: "in-use",
    createdAt: "2026-07-08T10:12:00Z",
    connection: {
      ipAddress: "192.168.1.105",
      accessKey: "qR7wT2nC8mX5jP4vL9bK"
    },
    spec: {
      k8sVersion: "v1.28.0",
      workerNodes: 4,
      nodeFlavor: "Medium (4 Cores, 8GB RAM)"
    }
  }),
  new ResourceSite({
    id: 11,
    name: "Legacy Active Directory",
    resourceType: "slices-vm",
    status: "online",
    createdAt: "2026-07-08T08:30:00Z",
    connection: {
      ipAddress: "10.0.5.150",
      accessKey: "vL4kP9nT2bC5mX8jR7wQ"
    },
    spec: {
      os: "Windows Server",
      cpuCores: 8,
      ramGB: 16,
      storageTB: 3.0
    }
  }),
  new ResourceSite({
    id: 12,
    name: "Staging Database",
    resourceType: "slices-vm",
    status: "maintenance",
    createdAt: "2026-07-08T11:00:00Z",
    connection: {
      ipAddress: "10.0.2.20",
      accessKey: "zX5bC2mN8jP4vL9kR7wT"
    },
    spec: {
      os: "Rocky Linux",
      cpuCores: 32,
      ramGB: 128,
      storageTB: 8.0
    }
  }),
  new ResourceSite({
    id: 13,
    name: "CI/CD Pipeline Runner",
    resourceType: "kubernetes-cluster",
    status: "online",
    createdAt: "2026-07-08T11:25:00Z",
    connection: {
      ipAddress: "10.0.50.15",
      accessKey: "bC8mN5vX2jP9tR4kL7wQ"
    },
    spec: {
      k8sVersion: "v1.28.0",
      workerNodes: 6,
      nodeFlavor: "Large (8 Cores, 32GB RAM)"
    }
  }),
  new ResourceSite({
    id: 14,
    name: "Elasticsearch Node Alpha",
    resourceType: "slices-vm",
    status: "in-use",
    createdAt: "2026-07-08T11:30:00Z",
    connection: {
      ipAddress: "10.0.2.10",
      accessKey: "nX2mP5vL8kR4wT7bC9jF"
    },
    spec: {
      os: "RHEL",
      cpuCores: 64,
      ramGB: 256,
      storageTB: 20.0
    }
  }),
  new ResourceSite({
    id: 15,
    name: "Internal DNS Server",
    resourceType: "slices-vm",
    status: "offline",
    createdAt: "2026-07-08T11:45:00Z",
    connection: {
      ipAddress: "192.168.1.53",
      accessKey: "xL5vN2mX8bC9jP4tR7wQ"
    },
    spec: {
      os: "Debian",
      cpuCores: 2,
      ramGB: 4,
      storageTB: 1.0
    }
  })
];

// L'ARRAY DEGLI ESPERIMENTI
export let mockExperiments = [
  new Experiment({
    id: 101,
    name: "Telecontrol Simulator Load Test",
    description: "Stress test massivo sui nodi ad albero del simulatore di telecontrollo per valutare la latenza di risposta del backend.",
    status: "completed",
    createdAt: "2026-06-10T09:15:00Z",
    allocatedResources: [
      { resourceId: 1, type: "namespace", namespaceName: "sim-backend" }, 
      { resourceId: 2, type: "full" }
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
      { resourceId: 4, type: "namespace", namespaceName: "ui-profiling" }
    ]
  }),
  new Experiment({
    id: 104,
    name: "Tree-Structure DB Pathing Optimization",
    description: "Verifica dell'integrità logica e dei tempi di query sui percorsi ad albero gerarchici nel database principale.",
    status: "running",
    createdAt: "2026-07-20T08:45:00Z",
    allocatedResources: [
      { resourceId: 1, type: "full" }, 
      { resourceId: 5, type: "full" }, 
      { resourceId: 7, type: "full" }
    ]
  }),
  new Experiment({
    id: 105,
    name: "Failover Protocol Rehearsal",
    description: "Simulazione di caduta improvvisa del nodo master per verificare i tempi di ripristino automatico e la resilienza dei dati.",
    status: "stopped",
    createdAt: "2026-07-15T16:20:00Z",
    allocatedResources: [] // Testiamo anche come appare un esperimento senza risorse allocate
  })
];