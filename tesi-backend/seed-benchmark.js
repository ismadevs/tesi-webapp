/**
 * seed-benchmark.js
 *
 * Popola CouchDB con esperimenti e risorse sintetici, per misurare il
 * comportamento del sistema al crescere del numero di documenti.
 *
 * SICUREZZA
 * Lo script scrive esclusivamente su CouchDB. Non invoca la CLI di SLICES,
 * non contatta l'infrastruttura e non alloca alcuna risorsa. Tutti i
 * documenti creati restano in stato DRAFT, che l'orchestratore ignora.
 *
 * Ogni documento generato ha un identificatore con prefisso "bench-", così
 * da poter essere rimosso senza toccare i dati reali.
 *
 * Uso:
 *   node seed-benchmark.js 100        crea 100 esperimenti, 2 risorse ciascuno
 *   node seed-benchmark.js 100 3      crea 100 esperimenti, 3 risorse ciascuno
 *   node seed-benchmark.js clean      rimuove tutti i documenti "bench-"
 *   node seed-benchmark.js count      conta i documenti presenti
 */

import dotenv from 'dotenv';
dotenv.config();

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USER = process.env.COUCHDB_USER || 'admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || 'admin';
const DB_NAME = process.env.COUCHDB_DB || 'orchestrator';

const DB_URL = `${COUCHDB_URL}/${DB_NAME}`;
const authHeader =
  'Basic ' + Buffer.from(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`).toString('base64');

// Prefisso che identifica i documenti sintetici. Serve a distinguerli dai
// dati reali sia in fase di conteggio sia in fase di rimozione.
const PREFIX = 'bench-';

const request = async (path, options = {}) => {
  const response = await fetch(`${DB_URL}${path}`, {
    ...options,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(`${response.status}: ${body.reason || response.statusText}`);
  }

  return body;
};

// Valori presi dal catalogo reale, così i documenti generati sono
// indistinguibili da quelli prodotti dall'interfaccia.
const FLAVORS = ['tiny', 'm1.small', 'small', 'medium', 'large'];
const IMAGES = ['Ubuntu 24.04.4', 'Ubuntu 26.04', 'Debian 13.5', 'Debian 12.7'];

const pick = (array, index) => array[index % array.length];

const buildDocuments = (experimentCount, resourcesPerExperiment) => {
  const docs = [];
  const now = new Date();

  for (let i = 0; i < experimentCount; i++) {
    const experimentId = `${PREFIX}exp-${String(i).padStart(5, '0')}`;

    // Le date sono distribuite all'indietro nel tempo, così l'ordinamento
    // per data di creazione della vista produce un risultato realistico.
    const createdAt = new Date(now.getTime() - i * 60000).toISOString();

    docs.push({
      _id: experimentId,
      type: 'experiment',
      spec: {
        name: `bench-experiment-${String(i).padStart(5, '0')}`,
        description: `Esperimento sintetico generato per le misure di prestazione, numero ${i}.`,
        duration: '2h',
      },
      status: 'DRAFT',
      remote: {
        slicesExperimentId: null,
        projectName: null,
        createdAt: null,
        expiresAt: null,
        deleted: false,
      },
      error: null,
      createdAt,
      updatedAt: createdAt,
    });

    for (let j = 0; j < resourcesPerExperiment; j++) {
      docs.push({
        _id: `${PREFIX}res-${String(i).padStart(5, '0')}-${j}`,
        type: 'resource',
        experimentId,
        spec: {
          name: `node-${j}`,
          kind: 'vm',
          infra: 'be-gent1-bi-vm1',
          flavor: pick(FLAVORS, i + j),
          image: pick(IMAGES, i + j),
          publicIpv4: false,
        },
        status: 'DRAFT',
        remote: {
          resourceId: null,
          slicesStatus: null,
          publicIpv4: null,
          privateIpv4: null,
          consoleUrl: null,
          sshLogin: null,
          createdAt: null,
          expiresAt: null,
          terminatedAt: null,
          failureReason: null,
        },
        createdAt,
        updatedAt: createdAt,
      });
    }
  }

  return docs;
};

const seed = async (experimentCount, resourcesPerExperiment) => {
  const docs = buildDocuments(experimentCount, resourcesPerExperiment);

  console.log(
    `Inserimento di ${experimentCount} esperimenti e ` +
    `${experimentCount * resourcesPerExperiment} risorse ` +
    `(${docs.length} documenti totali)`
  );

  // Inserimento a blocchi: una singola richiesta con migliaia di documenti
  // supererebbe i limiti di dimensione del corpo accettati dal server.
  const BATCH = 500;
  const startedAt = Date.now();

  for (let i = 0; i < docs.length; i += BATCH) {
    const slice = docs.slice(i, i + BATCH);
    await request('/_bulk_docs', {
      method: 'POST',
      body: JSON.stringify({ docs: slice }),
    });
    console.log(`  ${Math.min(i + BATCH, docs.length)}/${docs.length}`);
  }

  const elapsed = Date.now() - startedAt;
  console.log(`\nCompletato in ${elapsed} ms (${Math.round(docs.length / (elapsed / 1000))} documenti/s)`);
};

const count = async () => {
  const all = await request('/_all_docs?limit=0');
  const bench = await request(
    `/_all_docs?startkey="${PREFIX}"&endkey="${PREFIX}\ufff0"&limit=0`
  );

  console.log(`Documenti totali nel database: ${all.total_rows}`);
  console.log(`Di cui sintetici (prefisso "${PREFIX}"): ${bench.total_rows}`);
  console.log(`Documenti reali: ${all.total_rows - bench.total_rows}`);
};

const clean = async () => {
  // Si selezionano solo i documenti con il prefisso: l'intervallo di chiavi
  // si chiude con il carattere di ordinamento più alto, così da includere
  // tutti gli identificatori che iniziano con esso.
  const result = await request(
    `/_all_docs?startkey="${PREFIX}"&endkey="${PREFIX}\ufff0"&include_docs=true`
  );

  if (result.rows.length === 0) {
    console.log('Nessun documento sintetico da rimuovere.');
    return;
  }

  console.log(`Rimozione di ${result.rows.length} documenti sintetici`);

  const tombstones = result.rows.map((row) => ({
    _id: row.id,
    _rev: row.value.rev,
    _deleted: true,
  }));

  const BATCH = 500;
  for (let i = 0; i < tombstones.length; i += BATCH) {
    await request('/_bulk_docs', {
      method: 'POST',
      body: JSON.stringify({ docs: tombstones.slice(i, i + BATCH) }),
    });
    console.log(`  ${Math.min(i + BATCH, tombstones.length)}/${tombstones.length}`);
  }

  console.log('\nCompletato.');
};

const main = async () => {
  const command = process.argv[2];

  try {
    if (command === 'clean') {
      await clean();
    } else if (command === 'count') {
      await count();
    } else {
      const experimentCount = Number(command);
      const resourcesPerExperiment = Number(process.argv[3] ?? 2);

      if (!experimentCount || experimentCount < 1) {
        console.log('Uso: node seed-benchmark.js <numero> [risorse_per_esperimento]');
        console.log('     node seed-benchmark.js clean');
        console.log('     node seed-benchmark.js count');
        return;
      }

      await seed(experimentCount, resourcesPerExperiment);
    }
  } catch (error) {
    console.error(`\nErrore: ${error.message}`);
    process.exitCode = 1;
  }
};

main();