import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracion de Vite: se sirve bajo la ruta /registrar dentro del servidor unificado (3005)
export default defineConfig({
  base: '/registrar/', // imprescindible para que los assets carguen bajo /registrar
  plugins: [react()],
  // Modo desarrollo rapido (npm run dev): reenvia las llamadas /api al backend
  // para poder editar React con recarga en vivo (HMR) sin recompilar cada vez.
  server: {
    proxy: {
      '/api': 'http://localhost:3005',
    },
  },
})
