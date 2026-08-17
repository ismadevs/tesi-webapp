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

// Il nome del comando e' configurabile: se la CLI non e' nel PATH si puo'
// indicare il percorso completo dell'eseguibile dentro l'ambiente virtuale.
const SLICES_CLI = process.env.SLICES_CLI || 'slices';

// Oltre questa soglia il comando viene interrotto. La creazione di un
// esperimento richiede meno di un secondo, ma un valore esplicito evita che
// un comando bloccato tenga appeso il processo indefinitamente.
const COMMAND_TIMEOUT_MS = 60000;

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
    const startedAt = Date.now();

    execFile(
      SLICES_CLI,
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
          // vanno propagati all'utente cosi' come sono, perche' spiegano il
          // motivo reale del rifiuto (nome duplicato, quota esaurita, ecc.).
          const message = (stderr || stdout || err.message).trim();
          return reject(new Error(message));
        }

        resolve({ stdout, stderr, elapsedMs: Date.now() - startedAt });
      }
    );
  });

/**
 * Crea un esperimento su SLICES-RI e restituisce il suo identificatore.
 *
 * NOTA SULL'ESTRAZIONE DELL'IDENTIFICATORE
 * `experiment create` non offre --format json, quindi l'ID va letto
 * dall'output testuale. La CLI adatta pero' l'output al contesto: quando lo
 * standard output non e' un terminale, come qui perche' il processo e' figlio
 * di Node, elimina la formattazione decorativa e stampa il solo identificatore.
 * In modalita' interattiva stampa invece "Experiment ID: exp_...".
 * L'espressione regolare cerca il prefisso stabile "exp_" e copre entrambi i casi.
 */
export const createExperiment = async ({ name, description, duration }) => {
  const args = ['experiment', 'create', name, '-d', duration];

  // L'opzione viene omessa quando la descrizione e' vuota, invece di passare
  // una stringa vuota che la CLI registrerebbe come descrizione effettiva.
  if (description) {
    args.push('-D', description);
  }

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
 * Elenco degli esperimenti presenti su SLICES.
 * Utile per verificare dall'esterno l'esito di una materializzazione.
 */
export const listExperiments = async () => {
  const { stdout } = await runSlices(['experiment', 'list']);
  return stdout;
};

/**
 * Elimina un esperimento su SLICES.
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