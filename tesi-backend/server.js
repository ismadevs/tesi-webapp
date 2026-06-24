// Importa il framework Express, utilizzato per creare il server HTTP
// e definire le API REST del backend.
import express from 'express';

// Importa il middleware CORS,
// necessario per consentire al frontend React di comunicare
// con il backend anche se si trovano su porte differenti.
import cors from 'cors';

// Importa dotenv, una libreria che permette di caricare
// le variabili d'ambiente definite nel file .env.
import dotenv from 'dotenv';

// Importa il middleware di autenticazione JWT sviluppato da me.
// Questo middleware verifica che il token ricevuto sia valido
// e sia stato emesso da Keycloak.
import { checkJwt } from './src/middlewares/auth.middleware.js';

// Carica tutte le variabili presenti nel file .env
// all'interno dell'oggetto process.env.
dotenv.config();

// Crea un'istanza dell'applicazione Express.
const app = express();

// Definisce la porta sulla quale il server verrà avviato.
// Se esiste una variabile PORT nel file .env viene utilizzata,
// altrimenti viene usata la porta 3000 come valore di default.
const PORT = process.env.PORT || 3000;

// Abilita il middleware CORS per tutte le richieste.
// Permette ad applicazioni esterne (come React)
// di effettuare chiamate HTTP verso questo backend.
app.use(cors());

// Abilita il parsing automatico del body delle richieste JSON.
// Senza questo middleware req.body sarebbe undefined.
app.use(express.json());


// ===============================
// ROTTA PUBBLICA
// ===============================

// Endpoint accessibile senza autenticazione.
// Qualsiasi client può effettuare una richiesta GET
// verso /api/status.
app.get('/api/status', (req, res) => {

    // Restituisce una risposta JSON che indica
    // che il backend è attivo e funzionante.
    res.json({
        message: "Backend Node.js operativo e in ascolto!"
    });
});


// ===============================
// ROTTA PROTETTA
// ===============================

// Endpoint accessibile solamente agli utenti
// che possiedono un token JWT valido.
app.get('/api/protected-data',

    // Middleware di autenticazione.
    // Viene eseguito prima della funzione di risposta.
    // Se il token non è valido, la richiesta viene bloccata.
    checkJwt,

    // Questa funzione viene eseguita solamente
    // se checkJwt ha validato correttamente il token.
    (req, res) => {

        // Restituisce una risposta JSON contenente
        // un messaggio di conferma e alcune informazioni
        // estratte dal token autenticato.
        res.json({

            // Conferma che l'utente ha superato
            // i controlli di autenticazione.
            message: "Successo! Il tuo token è valido e sei autorizzato.",

            // req.auth viene creato automaticamente
            // dal middleware express-jwt.
            // Contiene i dati decodificati presenti nel JWT.
            user: req.auth.preferred_username
        });
    }
);


// ===============================
// GESTIONE GLOBALE DEGLI ERRORI
// ===============================

// Middleware speciale di Express dedicato
// alla gestione centralizzata degli errori.
app.use((err, req, res, next) => {

    // Verifica se l'errore è stato generato
    // dal middleware express-jwt.
    if (err.name === 'UnauthorizedError') {

        // Restituisce il codice HTTP 401 Unauthorized
        // insieme a un messaggio descrittivo.
        res.status(401).json({
            error: "Accesso negato: token mancante, scaduto o non valido."
        });
    }
});


// ===============================
// AVVIO DEL SERVER
// ===============================

// Avvia il server HTTP sulla porta specificata.
app.listen(PORT, () => {

    // Messaggio visualizzato nel terminale
    // quando il server è pronto a ricevere richieste.
    console.log(`🚀 Server in esecuzione sulla porta ${PORT}`);
});