// Mantengo le props classiche per mantenere la flessibilità del componente.
export default function AppButton({ children, icon, variant = "primary", onClick, ...rest }) {
  
  // Definisco gli stili di base condivisi da tutte le varianti (padding, angoli, transizioni)
  const baseStyles = "px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2";
  
  // Definisco le varianti grafiche usando le classi di Tailwind
  const variants = {
    primary: "bg-primary text-white hover:bg-blue-600 shadow-sm",
    outlined: "border-2 border-red-500 text-red-500 hover:bg-red-50"
  };

  return (
    <button
      onClick={onClick}
      // Unisco gli stili base, la variante scelta e le eventuali classi esterne (className)
      className={`${baseStyles} ${variants[variant] || variants.primary} ${rest.className || ""}`}
    >
      {children}
      {/* Visualizzo l'icona se presente */}
      {icon && <span>{icon}</span>}
    </button>
  );
}