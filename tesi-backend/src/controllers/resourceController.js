// Importiamo le singole funzioni destrutturate dal Service.
// Il Controller non ha idea di come vengano recuperati o salvati i dati nel database,
// il suo compito è semplicemente delegare la "logica di business" a queste funzioni.
import { createSite, getAllSites, deleteSite } from '../services/resourceService.js';

// ==========================================
// CONTROLLER PER LA LETTURA (GET)
// ==========================================
// req (Request): l'oggetto che contiene tutte le informazioni della chiamata in arrivo (header, parametri, ecc.)
// res (Response): l'oggetto che utilizziamo per confezionare e spedire la risposta indietro al browser/React.
export const getSites = (req, res) => {
  // Avvolgiamo tutto in un blocco try/catch. È fondamentale per evitare che 
  // un errore imprevisto faccia "crashare" (spegnere) l'intero server Node.js.
  try {
    // 1. DELEGA: Chiamiamo il Service per farci consegnare i dati.
    // CORREZIONE: Usiamo direttamente la funzione importata!
    const sites = getAllSites();
    
    // 2. RISPOSTA HTTP: Impostiamo lo Status Code 200 (OK), che indica che tutto
    // è andato a buon fine, e convertiamo l'array 'sites' in formato JSON da inviare al client.
    res.status(200).json(sites);
  } catch (error) {
    // 3. GESTIONE ERRORE: Se qualcosa si rompe (es. database non raggiungibile),
    // stampiamo l'errore tecnico nel terminale per aiutare noi sviluppatori nel debug...
    console.error("🚨 (Resources) ERRORE REALE DURANTE LA GET:", error); 
    
    // ...e rispondiamo al frontend con un codice 500 (Internal Server Error)
    // mascherando i dettagli tecnici all'utente finale.
    res.status(500).json({ error: "Errore nel recupero dei siti" });
  }
};

// ==========================================
// CONTROLLER PER LA CREAZIONE (POST)
// ==========================================
export const addSite = (req, res) => {
  try {
    // 1. ESTRAZIONE DATI: req.body contiene il payload (il pacchetto JSON) 
    // che l'utente ha inviato dal frontend tramite la richiesta POST.
    const siteData = req.body;
    
    // 2. VALIDAZIONE BASE: Ci assicuriamo che i requisiti minimi siano rispettati.
    if (!siteData.name) {
      // Se manca il nome (che è obbligatorio), blocchiamo l'esecuzione con il 'return'
      // e rispondiamo con status 400 (Bad Request), dicendo al frontend "Hai sbagliato la richiesta".
      return res.status(400).json({ error: "Il campo 'name' è obbligatorio." });
    }

    // 3. ESECUZIONE DELLA LOGICA: I dati sono validi, quindi li passiamo al Service.
    // Il Service applicherà il suo "stampino", genererà l'ID e lo salverà in memoria.
    // CORREZIONE: Usiamo direttamente createSite!
    const newSite = createSite(siteData);
    
    // 4. RISPOSTA DI SUCCESSO: Usiamo lo Status Code 201 (Created), che è lo standard REST
    // per confermare l'avvenuta creazione di una risorsa, e restituiamo al frontend
    // il nuovo oggetto completo (incluso il suo nuovo ID).
    res.status(201).json(newSite);
  } catch (error) {
    // 5. GESTIONE ERRORE: Catturiamo e gestiamo un'eventuale rottura del server.
    console.error("🚨 (Resources) ERRORE REALE DURANTE LA POST:", error);
    res.status(500).json({ error: "Errore interno del server" });
  }
};

// ==========================================
// CONTROLLER PER L'ELIMINAZIONE (DELETE)
// ==========================================
export const removeSite = (req, res) => {
  try {
    // 1. ESTRAZIONE PARAMETRO: Leggiamo l'id dalle variabili dell'URL (req.params)
    const { id } = req.params;

    // 2. DELEGA: Chiediamo al Service di eliminare il sito con questo ID
    const isDeleted = deleteSite(id);

    // 3. VERIFICA: Se il Service restituisce false, rispondiamo con un errore 404 (Not Found)
    if (!isDeleted) {
      return res.status(404).json({ error: `Sito di risorse con ID ${id} non trovato.` });
    }

    // 4. RISPOSTA DI SUCCESSO: Inviamo uno status 200 OK con un JSON di conferma
    res.status(200).json({ message: "Sito di risorse eliminato con successo." });

  } catch (error) {
    // Gestione di sicurezza per non far crashare il server
    console.error("🚨 (Resources) ERRORE REALE DURANTE LA DELETE:", error);
    res.status(500).json({ error: "Errore interno del server durante l'eliminazione" });
  }
};