// Importiamo l'istanza configurata di Keycloak. 
// Dato che l'abbiamo esportata dal file service, qui abbiamo accesso diretto ai metodi 
// per gestire la sessione senza dover passare prop dal genitore.
import keycloakConfig from '../services/keycloak';

// Importiamo l'icona da lucide-react per rendere il bottone più intuitivo visivamente.
import { LogOut } from 'lucide-react';

export default function Header(){
  
  // Questa funzione gestisce l'intero processo di disconnessione quando l'utente clicca il bottone.
  const handleLogout = () => {
    // 1. Pulizia locale:
    // Rimuoviamo il flag "hasSeenWelcome" dal sessionStorage del browser.
    // In questo modo, se lo stesso utente (o un altro) fa di nuovo il login in questa scheda,
    // il sistema si ricorderà di fargli rivedere il toast verde di benvenuto.
    sessionStorage.removeItem("hasSeenWelcome");
    
    // 2. Disconnessione dal server:
    // Chiamiamo il metodo ufficiale di Keycloak per chiudere la sessione.
    // Attenzione: questo non chiude solo l'app React, ma contatta il server Docker di Keycloak 
    // per invalidare il token in modo sicuro.
    keycloakConfig.logout({
      // redirectUri dice a Keycloak: "Dopo aver distrutto la sessione sul server, 
      // rimanda l'utente a questo specifico indirizzo".
      // window.location.origin prende dinamicamente la radice del sito (es. http://localhost:5173),
      // facendoti atterrare di nuovo in sicurezza sulla Landing Page pubblica.
      redirectUri: window.location.origin,
    });
  };

  return (
    // <header>: Tag HTML semantico per le intestazioni.
    // h-28: Imposta un'altezza fissa (112px) per l'header.
    // shrink-0: È una classe vitale nei layout flex! Dice al browser: "Se il contenuto principale 
    //           diventa lunghissimo, NON schiacciare o rimpicciolire questo header".
    // flex justify-end: Usa flexbox per spingere il contenuto (il bottone) tutto verso il margine destro.
    // px-12: Padding orizzontale per staccare il bottone dal bordo destro dello schermo.
    <header className="h-28 flex justify-end items-center px-12 shrink-0">
      
      {/* IL BOTTONE DI LOGOUT */}
      <button
        // Colleghiamo la funzione creata sopra all'evento di click.
        onClick={handleLogout}
        
        // ANALISI DELLE CLASSI TAILWIND:
        // px-4 py-2 rounded-lg: Crea la forma del bottone (spazio interno e angoli morbidi).
        // font-semibold text-sm: Testo semi-grassetto e leggermente più piccolo del normale per eleganza.
        // flex items-center justify-center gap-2: Allinea orizzontalmente il testo "Sign Out" e l'icona, distanziandoli di 8px.
        // bg-white text-black border border-gray-200: Lo stato "A riposo". Sfondo bianco, testo nero, bordino grigio chiaro.
        // transition-all duration-400: Rende fluidi (in 400 millisecondi) tutti i cambi di stato (colore, sfondo).
        
        // GLI STATI DI HOVER (Quando passi sopra col mouse):
        // hover:bg-red-500 hover:text-white hover:border-white: Il bottone si riempie di rosso, 
        // il testo diventa bianco e il bordo sparisce (diventando bianco), creando un feedback visivo di "azione distruttiva" (uscita).
        // cursor-pointer: Mostra la manina del mouse.
        className="px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-400 flex items-center justify-center gap-2 bg-white text-black border border-gray-200 hover:bg-red-500 hover:text-white hover:border-white cursor-pointer"
      >
        <span>Sign Out</span>
        
        {/* Renderizziamo l'icona passandole le dimensioni (16px) e uno spessore della linea bello marcato (2.5) */}
        <LogOut size={16} strokeWidth={2.5} />
      </button>
    </header>
  );
}