class ResourceSite{
  constructor({
    id,
    name,
    status,
    cpuCores,
    ramGB,
    storageTB,
    hostingType,
    os,
    ipAddress,
    lastPing
  }) {
    // L'ID è un numero intero. 
    // Quando faremo la POST, il Service calcolerà l'ID successivo e lo passerà qui.
    this.id = id;
    this.name = name;

    // Assicuriamoci che lo status sia uno di quelli previsti dall'Enum
    const validStatuses = ['online', 'offline', 'maintenance'];
    this.status = validStatuses.includes(status) ? status : 'offline';

    // Capacità Computazionale nidificata
    this.compute = {
      cpuCores: Number(cpuCores) || 0,
      ramGB: Number(ramGB) || 0,
      storageTB: Number(storageTB) || 0
    };

    // Tecnologie & Rete nidificate
    this.tech = {
      hostingType: hostingType || 'Unknown',
      os: os || 'Unknown',
      ipAddress: ipAddress || '0.0.0.0'
    };

    // Monitoraggio
    // Se non viene passata una data (es. creazione nuovo sito), mette l'istante attuale
    this.lastPing = lastPing || new Date().toISOString();
  }
}

module.exports = ResourceSite;