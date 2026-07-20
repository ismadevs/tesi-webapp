import Experiment from '../models/Experiment.js';

let mockExperiments = [
  new Experiment({
    id: 101,
    name: "Telecontrol Gateway Load Test",
    description: "Stress test sull'infrastruttura di telecontrollo per verificare la latenza sotto carico massimo simulato.",
    status: "completed",
    createdAt: "2026-07-10T09:00:00Z",
    allocatedResources: [
      {
        resourceId: 2, // Telecontrol Gateway (Slices VM)
        type: "full"
      },
      {
        resourceId: 5, // Simulation Replica (K8s Cluster)
        type: "full"
      }
    ]
  }),
  new Experiment({
    id: 102,
    name: "Data Science Algorithm v2",
    description: "Esecuzione batch del nuovo algoritmo di aggregazione dati sui worker node allocati.",
    status: "running",
    createdAt: "2026-07-18T14:30:00Z",
    allocatedResources: [
      {
        resourceId: 1, // Main Research Cluster (K8s Cluster)
        type: "namespace",
        namespaceName: "ds-algo-v2" // Occupiamo solo una porzione del cluster principale!
      },
      {
        resourceId: 7, // Machine Learning Worker A (Slices VM)
        type: "full"
      }
    ]
  }),
  new Experiment({
    id: 103,
    name: "Edge Analytics Sandbox",
    description: "Ambiente isolato per lo sviluppo di logiche edge senza interferire con i servizi core.",
    status: "stopped",
    createdAt: "2026-07-19T11:15:00Z",
    allocatedResources: [
      {
        resourceId: 4, // Edge Analytics (Slices VM)
        type: "full"
      },
      {
        resourceId: 10, // Redis Cache Cluster (K8s Cluster)
        type: "namespace",
        namespaceName: "sandbox-cache"
      }
    ]
  })
];

export default mockExperiments;