// Vite-Konfiguration fuer das MixMarket-Frontend.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5261,
    strictPort: true,
    // API- und Tracking-Anfragen an das Backend weiterleiten
    proxy: {
      '/api': { target: 'http://localhost:5260', changeOrigin: true },
      // Nur die Tracking-Pfade (/t/o, /t/c, /t/u) ans Backend, nicht z. B. /templates
      '/t/': { target: 'http://localhost:5260', changeOrigin: true },
    },
  },
})
