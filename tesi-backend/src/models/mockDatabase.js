// models/mockDatabase.js
import ResourceSite from './ResourceSite.js';

// Inizializziamo il database in memoria con ID interi
let mockSites = [
  new ResourceSite({
    id: 1,
    name: "Main Research Cluster",
    status: "online",
    cpuCores: 32,
    ramGB: 128,
    storageTB: 5.0,
    hostingType: "Kubernetes",
    os: "Ubuntu 24.04 LTS",
    ipAddress: "10.0.0.45",
    lastPing: "2026-07-02T18:42:00Z"
  }),
  new ResourceSite({
    id: 2,
    name: "Telecontrol Gateway",
    status: "online",
    cpuCores: 8,
    ramGB: 16,
    storageTB: 0.5,
    hostingType: "Docker",
    os: "Debian 12",
    ipAddress: "192.168.1.10",
    lastPing: "2026-07-02T19:30:00Z"
  }),
  new ResourceSite({
    id: 3,
    name: "Data Science Node",
    status: "maintenance",
    cpuCores: 64,
    ramGB: 256,
    storageTB: 12.0,
    hostingType: "Bare Metal",
    os: "RHEL 9",
    ipAddress: "172.16.0.100",
    lastPing: "2026-07-01T10:15:00Z"
  }),
  new ResourceSite({
    id: 4,
    name: "Edge Analytics",
    status: "offline",
    cpuCores: 4,
    ramGB: 8,
    storageTB: 0.2,
    hostingType: "Docker",
    os: "Alpine Linux",
    ipAddress: "10.0.0.55",
    lastPing: "2026-06-30T23:59:00Z"
  }),
  new ResourceSite({
    id: 5,
    name: "Simulation Replica",
    status: "online",
    cpuCores: 16,
    ramGB: 64,
    storageTB: 2.5,
    hostingType: "Kubernetes",
    os: "Ubuntu 24.04 LTS",
    ipAddress: "10.0.0.46",
    lastPing: "2026-07-02T19:40:00Z"
  })
];

export default mockSites;