import keycloakConfig from '../services/keycloak';
import { LogIn } from 'lucide-react';
import AppButton from '../components/AppButton';

export default function LandingPage() {
  
  const handleLogin = () => {
    // Avvio il processo di login verso Keycloak
    keycloakConfig.login({
      redirectUri: 'http://localhost:5173/home'
    });
  };

  return (
    // Contenitore "padre" di tutta la pagina. 
    // min-h-screen assicura che occupi SEMPRE tutto lo schermo.
    // flex e flex-col dispongono gli elementi in verticale (a colonna).
    <div className="min-h-screen flex flex-col">

      {/* Barra blu in alto: bg-primary pesca in automatico la variabile --color-primary 
          che ho impostato nel file index.css. h-10 equivale a 40px. */}
      <div className="h-10 bg-primary w-full"></div>

      {/* Container: limita la larghezza massima (max-w-7xl) e centra tutto (mx-auto). 
          flex-grow spinge il container a occupare tutto lo spazio bianco rimasto sotto la barra blu. */}
      <div className="max-w-7xl mx-auto w-full px-4 flex-grow flex flex-col">

        {/* BLOCCO CENTRALE: I titoli. 
            flex-grow qui dentro serve a spingere il blocco dei miei dati (il footer) verso il basso, 
            mantenendo questo testo perfettamente al centro dello schermo. */}
        <div className="flex-grow flex flex-col justify-center items-center text-center">
          
          {/* text-5xl e text-6xl su schermi medi (md:) replicano la grandezza dell'h2 di MUI.
              font-bold sostituisce il fontWeight: 700. */}
          <h1 className="mb-4 text-black font-bold text-5xl md:text-6xl tracking-tight">
            Tesi di Laurea Triennale
          </h1>
          
          {/* text-gray-500 replica il color="text.secondary". font-medium è il fontWeight: 500. */}
          <h2 className="font-medium text-gray-500 text-2xl md:text-3xl">
            Sviluppo di un'infrastruttura Cloud-Native per l'orchestrazione di risorse
          </h2>
        </div>

        {/* BLOCCO FOOTER: Dati a sinistra e Bottone a destra.
            flex e justify-between buttano i dati tutti a sinistra e il bottone tutto a destra.
            items-end allinea tutto sul fondo. pb-10 mi dà il margine inferiore. */}
        <div className="flex justify-between items-end pb-10">

          {/* Dati dello studente */}
          <div className="text-left">
            <p className="font-bold text-gray-600 text-lg md:text-xl">
              Ismaile Maataoui - Matricola: 0000975453
            </p>
            <p className="font-normal text-gray-600 text-lg md:text-xl">
              Ingegneria Informatica (L) - Università di Bologna
            </p>
          </div>

          {/* Mantengo il mio AppButton, ma tieni presente che nel prossimo step 
              dovremo tradurre anche lui da MUI a Tailwind per completare la transizione! */}
          <AppButton
            onClick={handleLogin}
            icon={<LogIn size={24} />}
          >
            Accesso Piattaforma
          </AppButton>

        </div>
      </div>
    </div>
  );
}