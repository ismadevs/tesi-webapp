import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Importo gli strumenti architetturali di Material UI
import { ThemeProvider, CssBaseline } from '@mui/material';
// Importo la tavolozza personalizzata creata nel file precedente
import { appTheme } from './theme/theme.js';

// Trovo la scatola vuota (<div id="root">) nell'index.html e inizio a renderizzare l'app al suo interno
ReactDOM.createRoot(document.getElementById('root')).render(
  
  // React.StrictMode è una sorta di "vigile" attivo solo in locale (npm run dev). 
  // Esegue i componenti due volte per aiutarti a scovare bug nascosti. Non va in produzione.
  <React.StrictMode>
    
    {/* ThemeProvider avvolge tutta l'app. Significa che qualsiasi componente dentro <App />
        potrà leggere automaticamente i colori e i font definiti in appTheme */}
    <ThemeProvider theme={appTheme}>
      
      {/* CssBaseline fa il "lavoro sporco": azzera i margini brutti predefiniti dal browser,
          imposta il font di base ovunque e applica il colore di background.default dello schermo */}
      <CssBaseline /> 
      
      {/* Infine, avvio il cuore dell' interfaccia utente */}
      <App />
      
    </ThemeProvider>
    
  </React.StrictMode>,
);