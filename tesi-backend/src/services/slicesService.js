// ==========================================
// SERVICE - ADATTATORE VERSO SLICES-RI
// ==========================================
// Unico punto del sistema che parla con l'infrastruttura. Incapsula
// l'invocazione della CLI come processo figlio, cosi' il resto del backend
// non sa nulla di comandi, argomenti e formati di output.
//
// PREREQUISITI SULLA MACCHINA CHE ESEGUE IL BACKEND
//   1. la CLI deve essere raggiungibile: `source ~/slices-venv/bin/activate`
//   2. l'autenticazione deve essere gia' avvenuta: `slices auth login`
//   3. il progetto deve essere selezionato: `slices project use tesi-unibo`
//
// Il token vive in ~/.slices/auth.json e viene letto dal processo figlio:
// il backend non lo gestisce e non lo conosce.

import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

const COMMAND_TIMEOUT_MS = 120000;

/**
 * Esegue un comando della CLI e restituisce il suo output.
 *
 * Si usa execFile con un ARRAY di argomenti, mai exec con una stringa: i valori
 * provengono da input utente e alcuni contengono spazi (i nomi delle immagini
 * disco, per esempio "Ubuntu 24.04.4"). La concatenazione in una stringa di
 * shell li spezzerebbe e aprirebbe la porta alla command injection.
 */
const runSlices = (args) =>
  new Promise((resolve, reject) => {
    // Il nome del comando viene letto a ogni esecuzione e non all'import del
    // modulo: in ES Modules gli import sono valutati prima del corpo di
    // server.js, quindi al momento dell'import dotenv non ha ancora caricato
    // il file .env e la variabile risulterebbe vuota.
    const cli = process.env.SLICES_CLI || 'slices';
    const startedAt = Date.now();

    execFile(
      cli,
      args,
      { timeout: COMMAND_TIMEOUT_MS, maxBuffer: 10 * 1024 * 1024 },
      (err, stdout, stderr) => {
        if (err) {
          // ENOENT significa che l'eseguibile non e' stato trovato: non e' un
          // fallimento della singola richiesta ma una configurazione mancante
          // del sistema, e merita un messaggio distinto.
          if (err.code === 'ENOENT') {
            return reject(new Error(
              'CLI di SLICES non trovata. Avvia il backend con l\'ambiente ' +
              'virtuale attivo (source ~/slices-venv/bin/activate).'
            ));
          }

          // La CLI scrive i messaggi di errore su stderr in forma leggibile:
          // vanno propagati cosi' come sono, perche' spiegano il motivo reale
          // del rifiuto (nome duplicato, campo sconosciuto, quota esaurita).
          const message = (stderr || stdout || err.message).trim();
          return reject(new Error(message));
        }

        resolve({ stdout, stderr, elapsedMs: Date.now() - startedAt });
      }
    );
  });

// ==========================================
// ESPERIMENTI
// ==========================================

/**
 * Crea un esperimento e restituisce il suo identificatore.
 *
 * NOTA SULL'ESTRAZIONE DELL'IDENTIFICATORE
 * `experiment create` non offre --format json, quindi l'ID va letto
 * dall'output testuale. La CLI adatta pero' l'output al contesto: quando lo
 * standard output non e' un terminale, come qui perche' il processo e' figlio
 * di Node, elimina la formattazione decorativa e stampa il solo
 * identificatore. In modalita' interattiva stampa "Experiment ID: exp_...".
 * L'espressione regolare cerca il prefisso stabile "exp_" e copre entrambi i casi.
 */
export const createExperiment = async ({ name, description, duration }) => {
  const args = ['experiment', 'create', name, '-d', duration];

  // L'opzione viene omessa quando la descrizione e' vuota, invece di passare
  // una stringa vuota che la CLI registrerebbe come descrizione effettiva.
  if (description) args.push('-D', description);

  const { stdout, elapsedMs } = await runSlices(args);

  const match = stdout.match(/(exp_\S+)/);
  if (!match) {
    throw new Error(
      `Impossibile estrarre l'Experiment ID dall'output della CLI: ${stdout.trim()}`
    );
  }

  return { slicesExperimentId: match[1], elapsedMs };
};

/**
 * Elimina un esperimento.
 *
 * Il flag --force e' obbligatorio quando il comando viene invocato da un
 * programma: senza, la CLI chiede una conferma interattiva e il processo figlio
 * resta in attesa di un input che non arrivera' mai, bloccandosi senza errore.
 * E' il caso peggiore da diagnosticare, perche' non produce alcun messaggio.
 */
export const deleteExperiment = async (nameOrId) => {
  await runSlices(['experiment', 'delete', nameOrId, '--force']);
  return true;
};

// ==========================================
// RISORSE - STRATEGIA A BLOCCO
// ==========================================

/**
 * Crea piu' risorse con una sola invocazione, tramite specifica su file.
 *
 * E' la strategia preferibile quando applicabile: una sola invocazione della
 * CLI invece di N, quindi un solo avvio dell'interprete Python e un solo
 * giro di rete verso l'infrastruttura.
 *
 * LIMITE VERIFICATO SPERIMENTALMENTE
 * La specifica JSON valida i campi e RIFIUTA `public_ipv4` con l'errore
 * "Object contains unknown field `public_ipv4` - at `$.resources[0]`".
 * Per questo l'orchestratore ricade sulla creazione singola quando almeno
 * una risorsa richiede un indirizzo pubblico.
 */
export const createResourcesFromFile = async ({ experimentId, resources, duration }) => {
  // Proiezione dal modello dati della piattaforma al formato atteso da SLICES.
  // I nomi differiscono volutamente: la piattaforma usa `infra` perche' la CLI
  // segnala `--site-id` come deprecato in favore di `--infra`, mentre il campo
  // dentro il file si chiama ancora site_id.
  const spec = {
    resources: resources.map((r) => ({
      site_id: r.spec.infra,
      friendly_name: r.spec.name,
      flavor: r.spec.flavor,
      disk_image: r.spec.image,
    })),
  };

  const specPath = path.join(os.tmpdir(), `slices-spec-${Date.now()}.json`);
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));

  try {
    const { stdout, elapsedMs } = await runSlices([
      'bi', 'create-from-file', specPath,
      '--experiment', experimentId,
      '--duration', duration,
    ]);

    return { stdout, elapsedMs, invocations: 1 };
  } finally {
    // Il file temporaneo va rimosso in ogni caso, anche in caso di errore.
    fs.unlinkSync(specPath);
  }
};

// ==========================================
// RISORSE - STRATEGIA SINGOLA
// ==========================================

/**
 * Crea una singola risorsa.
 *
 * A differenza della specifica su file, questo comando accetta --public-ipv4.
 *
 * Nota la posizione di --infra: sta PRIMA del sottocomando `create`, perche'
 * in SLICES l'infrastruttura non e' un parametro dell'operazione ma il
 * contesto in cui l'operazione avviene, dichiarato a livello del gruppo
 * `slices bi`. E' anche il motivo per cui il tipo di risorsa non esiste come
 * parametro: viene derivato dal sito.
 */
export const createResource = async ({
  experimentId, infra, name, flavor, image, duration, publicIpv4,
}) => {
  const args = [
    'bi', '--infra', infra,
    'create', name,
    '--experiment', experimentId,
    '--flavor', flavor,
    '--image', image,
    '--duration', duration,
  ];

  if (publicIpv4) args.push('--public-ipv4');

  const { stdout, elapsedMs } = await runSlices(args);
  return { stdout, elapsedMs };
};

/**
 * Elenco delle risorse di un esperimento, in formato strutturato.
 *
 * L'esistenza di --format json e' cio' che rende praticabile l'integrazione:
 * senza, si sarebbe costretti a interpretare tabelle formattate per la lettura
 * umana, che e' fragile e si rompe al primo cambio di layout.
 */
export const listResources = async (experimentId) => {
  const { stdout } = await runSlices([
    'bi', 'list',
    '--experiment', experimentId,
    '--format', 'json',
  ]);

  return JSON.parse(stdout);
};

/**
 * Distrugge una o piu' risorse. Anche qui --force e' necessario per evitare
 * la richiesta di conferma interattiva.
 */
export const destroyResources = async (experimentId, names) => {
  await runSlices(['bi', 'destroy', ...names, '--experiment', experimentId, '--force']);
  return true;
};