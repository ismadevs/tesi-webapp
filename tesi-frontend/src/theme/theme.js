// Importiamo la funzione createTheme dal pacchetto base di Material UI.
import { createTheme } from '@mui/material/styles';

// Creo la variabile appTheme e la esporto (export) in modo da poterla richiamare nel main.jsx
export const appTheme = createTheme({
  
  // La sezione 'typography' controlla globalmente tutti i testi (il componente <Typography>)
  typography: {
    // Sostituiamo il font di default (Roboto) con quello che abbiamo importato nell'index.html
    fontFamily: '"Wix Madefor Display", sans-serif',
  },

  // La sezione 'palette' è la tavolozza dei colori della webapp
  palette: {
    // 'primary' è il colore semantico principale. I bottoni (se non specificato diversamente) useranno questo.
    primary: {
      main: '#6090f8', // Il blu esatto della barra superiore
    },
    // 'background' definisce i colori di sfondo generali di tutta la pagina
    background: {
      default: '#ffffff', // Forziamo lo sfondo base a bianco puro per un look pulito
    },
  },
});