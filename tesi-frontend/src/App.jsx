import { useState, useEffect } from 'react';
import Keycloak from 'keycloak-js';
import './App.css';

// Configurazione del client Keycloak utilizzato per l'autenticazione.
// Vengono specificati l'URL del server Keycloak, il realm di appartenenza
// e il client registrato per l'applicazione frontend.
const keycloakConfig = new Keycloak({
  url: 'http://localhost:8080',
  realm: 'tesi-realm',
  clientId: 'tesi-frontend-client'
});

function App() {

  // Stato che indica il completamento della fase di inizializzazione
  // del client di autenticazione.
  const [isInitialized, setIsInitialized] = useState(false);

  // Stato che memorizza l'esito del processo di autenticazione
  // dell'utente corrente.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Stato per salvare la risposta di Node
  const [backendData, setBackendData] = useState(null);

  useEffect(() => {

    // Inizializzazione del client Keycloak all'avvio dell'applicazione.
    // L'opzione "login-required" impone l'autenticazione dell'utente:
    // se non risulta autenticato, viene automaticamente reindirizzato
    // alla pagina di login di Keycloak.
    keycloakConfig.init({ onLoad: 'login-required' })

      // Aggiornamento degli stati dell'applicazione al termine
      // dell'inizializzazione del client.
      .then((authenticated) => {
        setIsAuthenticated(authenticated);
        setIsInitialized(true);
      })

      // Gestione di eventuali errori durante la connessione
      // o l'inizializzazione del servizio di autenticazione.
      .catch((error) => {
        console.error("Errore di inizializzazione Keycloak:", error);
      });

  }, []); // Esecuzione una sola volta al montaggio del componente.

// Funzione asincrona che effettua una chiamata
// ad un endpoint protetto del backend Node.js.
const fetchProtectedData = async () => {

  try {

    // Invia una richiesta HTTP GET all'endpoint protetto.
    const response = await fetch(
      'http://localhost:3000/api/protected-data',
      {

        // Specifica il metodo HTTP utilizzato.
        method: 'GET',

        headers: {

          // Header Authorization contenente il token JWT.
          // Il prefisso "Bearer" indica che il token viene
          // utilizzato come credenziale di autenticazione.
          //
          // keycloakConfig.token contiene automaticamente
          // l'Access Token rilasciato da Keycloak dopo il login.
          'Authorization': `Bearer ${keycloakConfig.token}`
        }
      }
    );

    // Verifica se il backend ha restituito una risposta valida.
    // Se il codice HTTP non è compreso tra 200 e 299,
    // viene generata un'eccezione.
    if (!response.ok) {
      throw new Error("Accesso negato dal backend");
    }

    // Converte il body della risposta da JSON
    // ad oggetto JavaScript.
    const data = await response.json();

    // Salva i dati ricevuti nello stato React
    // per renderli successivamente nell'interfaccia utente.
    setBackendData(data);

  } catch (error) {

    // Visualizza l'errore nella console del browser.
    console.error("Errore API:", error);

    // Aggiorna lo stato con un messaggio di errore
    // da mostrare all'utente.
    setBackendData({
      error: "Accesso bloccato dal backend o server spento."
    });
  }
};
  
  // Durante la fase di inizializzazione viene mostrata una schermata
  // temporanea per informare l'utente che il sistema sta verificando
  // lo stato di autenticazione.
  if (!isInitialized) {
    return (
      <div style={{ padding: '2rem' }}>
        <h2>Connessione al server di sicurezza in corso...</h2>
      </div>
    );
  }

  // Se l'utente risulta autenticato, viene visualizzata l'area
  // protetta dell'applicazione.
  if (isAuthenticated) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Dashboard Orchestrazione Cloud</h1>
        <p>Login effettuato con successo. Benvenuto nell'area protetta!</p>

        {/* --- NUOVA SEZIONE DI TEST --- */}
        <div style={{ margin: '2rem 0', padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Test Integrazione Backend</h3>
          <button 
            onClick={fetchProtectedData} // Al click viene eseguita fetchProtectedData().
            style={{ padding: '10px 20px', cursor: 'pointer', marginBottom: '1rem' }}
          >
            Chiedi dati segreti a Node.js
          </button>
          
          {/* Mostriamo a schermo il JSON di risposta di Node.js */}
          {backendData && ( //Verifica che esista una risposta proveniente dal backend prima di mostrarla
            <div style={{ padding: '1rem', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
              <pre>{JSON.stringify(backendData, null, 2)}</pre> {/* Stampa il contenuto dell'oggetto backendData in formato JSON leggibile */}
            </div>
          )}
        </div>
        {/* FINE TEST */}
        
        {/* Pulsante che avvia la procedura di logout tramite Keycloak. */}
        <button
          onClick={() => keycloakConfig.logout()}
          style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer' }}
        >
          Logout dal sistema
        </button>
      </div>
    );
  }

  // Caso residuale: accesso non autorizzato o autenticazione fallita.
  return <div>Accesso Negato.</div>;
}

export default App;