import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// Importo il file CSS globale che configuro per Tailwind
import './index.css';

// Importo il componente che visualizza i toast (notifiche) in tutta l'applicazione
import { Toaster } from 'react-hot-toast';

// Trovo la scatola vuota (<div id="root">) nell'index.html e inizio a renderizzare l'app al suo interno
ReactDOM.createRoot(document.getElementById('root')).render(

  // React.StrictMode è una sorta di "vigile" attivo solo in locale (npm run dev).
  // Esegue alcuni controlli aggiuntivi per aiutarti a individuare bug durante lo sviluppo.
  // In produzione non ha alcun effetto.
  <React.StrictMode>

    {/* Inserisco il Toaster una sola volta a livello globale.
        Da questo momento qualsiasi componente dell'app potrà mostrare
        notifiche semplicemente chiamando toast.success(), toast.error(), ecc. */}
    <Toaster
      position="bottom-left"
      toastOptions={{
        // Ogni toast rimane visibile per 4 secondi prima di scomparire automaticamente
        duration: 4000,
      }}
    />

    {/* Infine, avvio il cuore dell'interfaccia utente */}
    <App />

  </React.StrictMode>,
);