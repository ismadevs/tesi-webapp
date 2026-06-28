import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Importo il file CSS globale che configuro per Tailwind
import './index.css';

// Trovo la scatola vuota (<div id="root">) nell'index.html e inizio a renderizzare l'app al suo interno
ReactDOM.createRoot(document.getElementById('root')).render(
  
  // React.StrictMode è una sorta di "vigile" attivo solo in locale (npm run dev). 
  // Esegue i componenti due volte per aiutarti a scovare bug nascosti. Non va in produzione.
  <React.StrictMode>
      {/* Infine, avvio il cuore dell' interfaccia utente */}
      <App />  
  </React.StrictMode>,
);