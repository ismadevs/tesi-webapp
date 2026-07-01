import { Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useEffect, useRef } from "react";

function ProtectedRoute({ isAuthenticated, children }) {
  const hasShownToast = useRef(false);

  useEffect(() => {
    // Evita la duplicazione del toast causata dal React Strict Mode
    if (hasShownToast.current) return;

    // Se l'utente tenta di montare questo componente senza essere autenticato, spara il toast
    if (!isAuthenticated) {
      hasShownToast.current = true;
      toast.error(
        "Please sign in before accessing the application!",
        {
          id: "auth-required",
          position: "top-center",
          style: {
            minWidth: "420px",
            fontSize: "16px",
            margin: "60px",
          },
        }
      );
    }
  }, [isAuthenticated]);

  // Se l'utente non possiede un token valido,
  // impedisco l'accesso alla pagina privata e lo rimando alla Home pubblica.
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Se è autenticato, mostro normalmente il componente figlio
  return children;
}

export default ProtectedRoute;