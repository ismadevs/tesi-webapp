import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// Importo il plugin ufficiale di Tailwind per Vite
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Inietto Tailwind direttamente nel processo di build di Vite.
    // In questo modo evito di dover creare file di configurazione esterni come postcss.config.js
    tailwindcss(),
  ],
})