// ==========================================
// CATALOGO SLICES-RI
// ==========================================
// Copia locale di cio' che l'infrastruttura offre. I dati provengono
// dall'output reale di `slices bi infra list`, `slices bi flavor list` e
// `slices bi diskimage list`.
//
// PERCHE' UNA COPIA E NON UNA LETTURA DIRETTA
// Interrogare la CLI a ogni apertura di un form significherebbe attendere
// centinaia di millisecondi per dati che cambiano raramente. La copia locale
// rende l'interfaccia immediata.
//
// PERCHE' NON VALORI SCRITTI NELL'INTERFACCIA
// Il catalogo evolve: Ubuntu 26.04 e Debian 13.5 sono comparsi nel maggio
// 2026, ed esiste un flavor `bdt-vm` creato per un corso universitario che la
// documentazione non menziona. Valori scritti nel frontend comincerebbero a
// mentire nel giro di mesi.
//
// Il campo fetchedAt rende esplicito che si tratta di un'istantanea. Quando
// l'orchestratore verra' esteso, una funzione periodica aggiornera' questi
// dati interrogando la CLI, e il resto del sistema non cambiera'.

export const FETCHED_AT = '2026-08-02T00:00:00Z';

// ==========================================
// INFRASTRUTTURE
// ==========================================
// `bi-orchestrator` non compare qui perche' non e' un luogo dove le macchine
// girano: e' un livello di aggregazione che interroga tutti i siti e unisce i
// risultati. Per creare una risorsa serve il sito specifico.
//
// Il campo `kind` e' la chiave del modello: SLICES non ha un parametro per il
// tipo di risorsa, lo deriva dal sito. L'interfaccia fa il percorso inverso,
// chiedendo il tipo all'utente e ricavandone il sito.
export const INFRASTRUCTURES = [
  {
    kind: 'vm',
    infra: 'be-gent1-bi-vm1',
    label: 'Virtual machine',
    description: 'Istanza virtualizzata, allocata in pochi minuti.',
    location: 'Gent, Belgio',
  },
  {
    kind: 'baremetal',
    infra: 'be-gent1-bi-baremetal1',
    label: 'Bare metal',
    description: 'Server fisico dedicato, senza strato di virtualizzazione.',
    location: 'Gent, Belgio',
  },
];

// ==========================================
// FLAVOR
// ==========================================
// I due insiemi sono DISGIUNTI: nessun flavor esiste su entrambi i siti.
// Hanno anche attributi diversi, e non e' un dettaglio cosmetico.
//
// Sulle VM il campo CPU e' un numero di vCPU astratte. Sul baremetal e' una
// topologia fisica nella forma socket x core x thread (`1x16x2`), che su una
// macchina virtuale non avrebbe senso perche' l'hardware reale e' nascosto.
// Il baremetal ha inoltre GPU e interfacce di rete.
export const FLAVORS = {
  'be-gent1-bi-vm1': [
    { name: 'tiny',     description: 'Minimal VM',                     vcpus: 1, ramGib: 1,  rootDiskGb: 10  },
    { name: 'm1.small', description: 'Small General Purpose VM',       vcpus: 1, ramGib: 2,  rootDiskGb: 10  },
    { name: 'small',    description: 'Small General Purpose VM',       vcpus: 2, ramGib: 4,  rootDiskGb: 20  },
    { name: 'medium',   description: 'Medium General Purpose VM',      vcpus: 4, ramGib: 8,  rootDiskGb: 50  },
    { name: 'bdt-vm',   description: 'VM for BDT course',              vcpus: 4, ramGib: 8,  rootDiskGb: 75  },
    { name: 'large',    description: 'Large General Purpose VM',       vcpus: 4, ramGib: 16, rootDiskGb: 100 },
    { name: 'xlarge',   description: 'Extra Large General Purpose VM', vcpus: 8, ramGib: 32, rootDiskGb: 200 },
  ],

  'be-gent1-bi-baremetal1': [
    { name: 'pc',              description: 'Any baremetal pc',       cpuTopology: '0x0x0',  ramGib: 0,      rootDiskGb: 0,    gpu: null },
    { name: 'pcgen05-gpu5090', description: 'Generation 5 with GPU',  cpuTopology: '1x8x1',  ramGib: 32,     rootDiskGb: 250,  gpu: 'GTX5090' },
    { name: 'pcgen07',         description: 'Generation 7',           cpuTopology: '1x6x1',  ramGib: 64,     rootDiskGb: 512,  gpu: null },
    { name: 'pcgen07-gpu1080', description: 'Generation 7 with GPU',  cpuTopology: '1x6x1',  ramGib: 64,     rootDiskGb: 512,  gpu: 'GTX1080' },
    { name: 'pcgen07-gpu980',  description: 'Generation 7 with GPU',  cpuTopology: '1x6x1',  ramGib: 64,     rootDiskGb: 512,  gpu: 'GTX980' },
    { name: 'pcgen08',         description: 'Generation 8 with GPU',  cpuTopology: '1x8x1',  ramGib: 500.75, rootDiskGb: 250,  gpu: 'GTX5090' },
    { name: 'pcgen08-gpu4500', description: 'Generation 8 with GPU',  cpuTopology: '1x16x2', ramGib: 500,    rootDiskGb: 1000, gpu: 'RTX PRO 4500' },
    { name: 'pcgen08-gpu5080', description: 'Generation 8 with GPU',  cpuTopology: '1x16x2', ramGib: 500,    rootDiskGb: 1000, gpu: 'RTX PRO 5080' },
    { name: 'pcgen08-gpu5090', description: 'Generation 8 with GPU',  cpuTopology: '1x16x2', ramGib: 500,    rootDiskGb: 1000, gpu: 'RTX PRO 5090' },
    { name: 'pcgen08-gpu6000', description: 'Generation 8 with GPU',  cpuTopology: '1x16x2', ramGib: 500,    rootDiskGb: 1000, gpu: 'RTX PRO 6000' },
  ],
};

// ==========================================
// IMMAGINI DISCO
// ==========================================
// ATTENZIONE ALL'IDENTITA' DI UNA VOCE: e' la coppia (infra, nome), non il
// nome da solo. "Ubuntu 24.04.3" compare su entrambi i siti come due voci
// distinte, con date di registrazione diverse. Un modello che salvasse solo
// il nome perderebbe l'informazione necessaria a disambiguare.
export const DISK_IMAGES = {
  'be-gent1-bi-vm1': [
    { name: 'Ubuntu 26.04',   registeredAt: '2026-05-19T10:23:00Z' },
    { name: 'Ubuntu 24.04.4', registeredAt: '2026-05-19T10:21:00Z' },
    { name: 'Ubuntu 24.04.3', registeredAt: '2025-10-07T18:17:00Z' },
    { name: 'Ubuntu 24.04.1', registeredAt: '2024-10-15T01:33:00Z' },
    { name: 'Ubuntu 22.04.5', registeredAt: '2024-05-08T14:09:00Z' },
    { name: 'Debian 13.5',    registeredAt: '2026-05-19T10:22:00Z' },
    { name: 'Debian 13.1',    registeredAt: '2025-10-07T00:12:00Z' },
    { name: 'Debian 13.0',    registeredAt: '2025-08-10T11:38:00Z' },
    { name: 'Debian 12.7',    registeredAt: '2024-05-08T14:09:00Z' },
    { name: 'Debian 12.5',    registeredAt: '2024-05-08T14:08:00Z' },
  ],

  'be-gent1-bi-baremetal1': [
    { name: 'Ubuntu 24.04.3', registeredAt: '2025-10-08T13:36:00Z' },
    { name: 'Ubuntu 24.04.1', registeredAt: '2024-10-01T13:13:00Z' },
    { name: 'Ubuntu 22.04.5', registeredAt: '2024-08-20T11:31:00Z' },
  ],
};

// ==========================================
// FUNZIONI DI SUPPORTO
// ==========================================

// Traduce la scelta dell'utente (vm o baremetal) nell'identificatore del sito
// atteso da SLICES. E' il punto in cui l'astrazione dell'interfaccia incontra
// il vocabolario della piattaforma.
export const infraForKind = (kind) =>
  INFRASTRUCTURES.find((i) => i.kind === kind)?.infra ?? null;

export const kindForInfra = (infra) =>
  INFRASTRUCTURES.find((i) => i.infra === infra)?.kind ?? null;

export const findFlavor = (infra, name) =>
  (FLAVORS[infra] || []).find((f) => f.name === name) ?? null;

export const findImage = (infra, name) =>
  (DISK_IMAGES[infra] || []).find((i) => i.name === name) ?? null;

// Catalogo completo per il frontend: una sola richiesta popola tutti i menu
// a tendina, e la cascata (il sito filtra flavor e immagini) viene applicata
// lato client senza ulteriori giri di rete.
export const getCatalog = () => ({
  fetchedAt: FETCHED_AT,
  infrastructures: INFRASTRUCTURES,
  flavors: FLAVORS,
  diskImages: DISK_IMAGES,
});