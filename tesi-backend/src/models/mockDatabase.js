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
    os: "Ubuntu",
    ipAddress: "10.0.0.45",
    lastPing: "2026-07-02T18:42:00Z"
  }),
  new ResourceSite({
    id: 2,
    name: "Telecontrol Gateway",
    status: "online",
    cpuCores: 8,
    ramGB: 16,
    storageTB: 1.0,
    hostingType: "Docker",
    os: "Debian",
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
    os: "RHEL",
    ipAddress: "172.16.0.100",
    lastPing: "2026-07-01T10:15:00Z"
  }),
  new ResourceSite({
    id: 4,
    name: "Edge Analytics",
    status: "offline",
    cpuCores: 4,
    ramGB: 8,
    storageTB: 1.0,
    hostingType: "Docker",
    os: "AlmaLinux",
    ipAddress: "10.0.0.55",
    lastPing: "2026-06-30T23:59:00Z"
  }),
  new ResourceSite({
    id: 5,
    name: "Simulation Replica",
    status: "online",
    cpuCores: 16,
    ramGB: 64,
    storageTB: 3.0,
    hostingType: "Kubernetes",
    os: "Ubuntu",
    ipAddress: "10.0.0.46",
    lastPing: "2026-07-02T19:40:00Z"
  }),
  new ResourceSite({
    id: 6,
    name: "Compute Nexus",
    status: "offline",
    cpuCores: 32,
    ramGB: 128,
    storageTB: 5.0,
    hostingType: "Bare Metal",
    os: "Debian",
    ipAddress: "10.0.0.58",
    lastPing: "2026-07-07T08:25:00Z"
  }),
  new ResourceSite({
    id: 7,
    name: "Machine Learning Worker A",
    status: "online",
    cpuCores: 128,
    ramGB: 1024,
    storageTB: 16.0,
    hostingType: "Dedicated Host",
    os: "Ubuntu",
    ipAddress: "172.16.5.10",
    lastPing: "2026-07-08T09:15:00Z"
  }),
  new ResourceSite({
    id: 8,
    name: "Machine Learning Worker B",
    status: "offline",
    cpuCores: 128,
    ramGB: 1024,
    storageTB: 16.0,
    hostingType: "Dedicated Host",
    os: "Ubuntu",
    ipAddress: "172.16.5.11",
    lastPing: "2026-07-08T09:15:00Z"
  }),
  new ResourceSite({
    id: 9,
    name: "Frontend Load Balancer",
    status: "online",
    cpuCores: 4,
    ramGB: 8,
    storageTB: 1.0,
    hostingType: "Kubernetes",
    os: "AlmaLinux",
    ipAddress: "10.1.0.50",
    lastPing: "2026-07-08T10:05:00Z"
  }),
  new ResourceSite({
    id: 10,
    name: "Redis Cache Cluster",
    status: "online",
    cpuCores: 16,
    ramGB: 64,
    storageTB: 2.0,
    hostingType: "Docker",
    os: "Debian",
    ipAddress: "192.168.1.105",
    lastPing: "2026-07-08T10:12:00Z"
  }),
  new ResourceSite({
    id: 11,
    name: "Legacy Active Directory",
    status: "online",
    cpuCores: 8,
    ramGB: 16,
    storageTB: 3.0,
    hostingType: "Dedicated Instance",
    os: "Windows Server",
    ipAddress: "10.0.5.150",
    lastPing: "2026-07-08T08:30:00Z"
  }),
  new ResourceSite({
    id: 12,
    name: "Staging Database",
    status: "maintenance",
    cpuCores: 32,
    ramGB: 128,
    storageTB: 8.0,
    hostingType: "Shared Cloud",
    os: "Rocky Linux",
    ipAddress: "10.0.2.20",
    lastPing: "2026-07-08T11:00:00Z"
  }),
  new ResourceSite({
    id: 13,
    name: "CI/CD Pipeline Runner",
    status: "online",
    cpuCores: 48,
    ramGB: 192,
    storageTB: 5.0,
    hostingType: "Docker",
    os: "Ubuntu",
    ipAddress: "10.0.50.15",
    lastPing: "2026-07-08T11:25:00Z"
  }),
  new ResourceSite({
    id: 14,
    name: "Elasticsearch Node Alpha",
    status: "online",
    cpuCores: 64,
    ramGB: 256,
    storageTB: 20.0,
    hostingType: "Bare Metal",
    os: "RHEL",
    ipAddress: "10.0.2.10",
    lastPing: "2026-07-08T11:30:00Z"
  }),
  new ResourceSite({
    id: 15,
    name: "Internal DNS Server",
    status: "online",
    cpuCores: 2,
    ramGB: 4,
    storageTB: 1.0,
    hostingType: "Shared Cloud",
    os: "Debian",
    ipAddress: "192.168.1.53",
    lastPing: "2026-07-08T11:45:00Z"
  })
];

export default mockSites;