import { Box, Typography, Button, Container } from '@mui/material';
import LoginRoundedIcon from '@mui/icons-material/Login';

export default function LandingPage(){
  const handleFakeLogin = () => {
    console.log("Il tasto login è stato cliccato! In futuro aprirà Keycloak.");
  };

  return (
    // Box principale: è il contenitore "padre" di tutta la pagina. 
    // minHeight: '100vh' assicura che occupi SEMPRE tutto lo schermo, anche se c'è poco testo.
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* Barra blu in alto: prende in automatico il colore 'primary.main' definito nel nostro theme.js */}
      <Box sx={{ height: '40px', backgroundColor: 'primary.main', width: '100%' }} />

      {/* Container: limita la larghezza massima (maxWidth="xl") e centra tutto. 
          flexGrow: 1 spinge il container a occupare tutto lo spazio bianco rimasto sotto la barra blu. */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

        {/* BLOCCO CENTRALE: I titoli. 
            flexGrow: 1 qui dentro serve a spingere il blocco dei tuoi dati (il footer) verso il basso, 
            mantenendo questo testo perfettamente al centro dello schermo. */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          
          {/* component="h1" dice al browser (e a Google) che questo è il titolo principale.
              variant="h2" usa le dimensioni grafiche di un h2 di Material UI. */}
          <Typography 
            variant="h2" 
            component="h1" 
            sx={{ mb: 4, color: '#000', fontWeight: 700 }} // fontWeight forzato nel sx per massima priorità
          >
            Tesi di Laurea Triennale
          </Typography>
          
          <Typography 
            variant="h4" 
            color="text.secondary" 
            sx={{ fontWeight: 500 }} 
          >
            Sviluppo di un'infrastruttura Cloud-Native per l'orchestrazione di risorse
          </Typography>
        </Box>

        {/* BLOCCO FOOTER: Dati a sinistra e Bottone a destra.
            justifyContent: 'space-between' butta i dati tutti a sinistra e il bottone tutto a destra. */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', pb: 6, px: 2 }}>

          {/* Dati dello studente */}
          <Box sx={{ textAlign: 'left' }}>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ fontWeight: 700 }} // nome e matricola in grassetto
            >
              Ismaile Maataoui - Matricola: 0000975453
            </Typography>
            <Typography 
              variant="h6" 
              color="text.secondary"
              sx={{ fontWeight: 400, }} // Il corso e l'università più leggeri
            >
              Ingegneria Informatica (L) - Università di Bologna
            </Typography>
          </Box>

          {/* Tasto Login 
              disableElevation: rimuove l'ombra predefinita di Material UI.
              textTransform: 'none' evita che il testo del bottone diventi TUTTO MAIUSCOLO di default. */}
          <Button
            variant="contained"
            size="large"
            disableElevation
            onClick={handleFakeLogin}
            endIcon={<LoginRoundedIcon />}
            sx={{ py: 1.5, px: 4, fontSize: '1.2rem', borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
          >
            Accesso Piattaforma
          </Button>

        </Box>
      </Container>
    </Box>
  );
}