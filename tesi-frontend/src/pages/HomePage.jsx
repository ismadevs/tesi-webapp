import keycloakConfig from '../services/keycloak';
import { LogOut } from 'lucide-react';
import AppButton from '../components/AppButton';

export default function HomePage() {
  
  const handleLogout = () => {
    // Eseguo il logout chiudendo la sessione in Keycloak
    keycloakConfig.logout();
  };

  return (
    // Centriamo tutto verticalmente e orizzontalmente a tutto schermo
    <div className="min-h-screen flex flex-col items-center justify-center gap-6">
      
      <h1 className="text-4xl font-bold">Hello World!</h1>
      
      {/* 
         Per il logout: uso il componente AppButton passando la variante 'outlined' 
         che abbiamo personalizzato per essere rossa (color="error" nel vecchio MUI).
         Qui gli forzo la classe Tailwind per renderlo rosso pieno come volevi: 
         bg-red-600, testo bianco, hover rosso scuro.
      */}
      <AppButton 
        onClick={handleLogout} 
        icon={<LogOut size={20} />}
        className="bg-red-600 text-white hover:bg-red-700 border-none"
      >
        Logout
      </AppButton>

    </div>
  );
}