// Importiamo i due "mattoncini" visivi che compongono la nostra cornice fissa.
import Sidebar from './Sidebar';
import Header from './Header';

// La prop { children } è il segreto di questo componente.
// Quando in un altro file scriverai <PageLayout> <h1>Ciao</h1> </PageLayout>,
// React prenderà l'intero <h1>Ciao</h1> e lo infilerà automaticamente dentro la variabile 'children'.
export default function PageLayout({ children }){
  return (
    // CONTENITORE PADRE GLOBALE
    // min-h-screen: Impone che lo sfondo bianco copra sempre almeno il 100% dell'altezza dello schermo, 
    //               anche se la pagina ha pochissimo testo.
    // flex: Trasforma questo div in un contenitore flessibile orizzontale. 
    //       Questo è ciò che permette alla Sidebar e al <main> di stare uno di fianco all'altro.
    <div className="min-h-screen flex bg-white text-black">
      
      {/* LA CORNICE SINISTRA */}
      {/* Inseriamo la Sidebar. Essendo il primo figlio del contenitore 'flex', 
          si posizionerà naturalmente a sinistra. */}
      <Sidebar />

      {/* L'AREA DESTRA (Tutto lo spazio rimanente) */}
      {/* flex-1: È un comando potentissimo di Tailwind. Dice a questo <main>: 
                  "Prenditi tutto lo spazio orizzontale che la Sidebar ha lasciato libero".
          flex flex-col: Trasforma a sua volta questo <main> in un contenitore flessibile, 
                         ma stavolta in verticale (column). Così Header starà sopra e il contenuto sotto. */}
      <main className="flex-1 flex flex-col">
        
        {/* LA CORNICE ALTA */}
        {/* L'Header si posizionerà automaticamente in cima a questa colonna destra. */}
        <Header />

        {/* IL BUCO DELLA SERRATURA (Il contenitore del contenuto dinamico) */}
        {/* max-w-5xl: Limita la larghezza massima (circa 1024px) per evitare che il testo 
                       diventi lungo chilometri sui monitor ultra-wide (pessimo per la leggibilità).
            w-full: Fino a quando non raggiunge la larghezza massima, occupa tutto lo spazio.
            mx-auto: margin-x auto. Calcola automaticamente il margine destro e sinistro per CENTRARE questo div.
            px-1: Un piccolissimo padding orizzontale (4px) per non far appiccicare il testo ai bordi sui display piccoli.
            mt-20 e pb-20: Margine sopra (80px) e padding sotto (80px) per far respirare il contenuto rispetto all'Header e al fondo pagina. */}
        <div className="max-w-5xl w-full mx-auto px-1 pb-20 mt-20">
          
          {/* LA MAGIA */}
          {/* Qui viene "iniettato" il codice specifico della pagina che sta usando questo Layout.
              Se sei su /home, qui ci sarà il testo di benvenuto.
              Se sei su /resources, qui apparirà la tua futura tabella. */}
          {children}
          
        </div>
      </main>
    </div>
  );
}