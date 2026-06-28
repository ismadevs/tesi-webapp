import { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importo la configurazione centralizzata di Keycloak che ho creato nel file di servizio
import keycloakConfig from './services/keycloak';

// Importo le schermate (pagine) della mia applicazione
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';

function App() {
  // Uso questo stato per capire se Keycloak ha finito di parlare col server. 
  // Finché è false, tengo lo schermo in attesa.
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Uso questo stato per memorizzare il verdetto: ho il token valido o no?
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // In ambiente di sviluppo (Strict Mode), React esegue gli useEffect due volte per cercare bug.
  // Uso questa referenza (ref) per assicurarmi di chiamare l'avvio di Keycloak una singola volta.
  const hasInitialized = useRef(false);

  // Questo blocco di codice parte in automatico appena si avvia l'App
  useEffect(() => {
    // Se sono già passato di qui, fermo subito l'esecuzione
    if (hasInitialized.current) return;
    // Altrimenti, mi segno che ora ci sono passato
    hasInitialized.current = true;

    // Avvio la libreria di Keycloak.
    // Imposto checkLoginIframe a false per evitare l'errore "frame-ancestors" e i blocchi del browser.
    keycloakConfig.init({ 
      onLoad: 'check-sso',
      checkLoginIframe: false 
    })
      .then((authenticated) => {
        // Se Keycloak mi risponde con successo, salvo se l'utente ha il token o meno...
        setIsAuthenticated(authenticated);
        // ...e sblocco l'interfaccia impostando isInitialized a true.
        setIsInitialized(true);
      })
      .catch((error) => {
        // Se c'è un errore grave di rete (es. il container di Keycloak è spento) lo stampo
        console.error("Errore di inizializzazione Keycloak:", error);
        
        // Sblocco comunque l'interfaccia per mostrare all'utente la Landing Page
        // invece di lasciarlo davanti a uno schermo bianco all'infinito.
        setIsInitialized(true);
      });
  }, []); // L'array vuoto significa: "esegui questo blocco solo al primo avvio"

  // Finché Keycloak non ha finito il suo lavoro in background, 
  // restituisco 'null' per mostrare uno schermo pulito
  if (!isInitialized) {
    return null;
  }

  // Se Keycloak è pronto, restituisco l'interfaccia grafica
  return (
    // BrowserRouter è il "motore" che abilita il cambio di URL (es. /home) senza ricaricare la pagina web
    <BrowserRouter>
      {/* Routes è il contenitore di tutti i possibili percorsi della mia app */}
      <Routes>
        
        {/* ROTTA PUBBLICA (Root URL: / ) */}
        <Route 
          path="/" 
          element={
            // Controllo lo stato dell'autenticazione:
            // Se NON sono autenticato (!isAuthenticated), mostro la mia Landing Page pubblica.
            // Se INVECE ho già il token, uso Navigate per rimbalzare l'utente direttamente sulla Dashboard (/home)
            !isAuthenticated 
              ? <LandingPage /> 
              : <Navigate to="/home" replace />
          } 
        />
        
        {/* ROTTA PRIVATA (URL: /home) */}
        <Route 
          path="/home" 
          element={
            // Proteggo questa pagina:
            // Se l'utente HA il token (isAuthenticated), gli permetto di renderizzare la HomePage.
            // Se tenta di scrivere "/home" a mano ma non ha fatto il login, lo rispedisco subito alla "/"
            isAuthenticated 
              ? <HomePage /> 
              : <Navigate to="/" replace />
          } 
        />

      </Routes>
    </BrowserRouter>
  );
}

// Esporto il componente per poterlo "iniettare" in main.jsx
export default App;