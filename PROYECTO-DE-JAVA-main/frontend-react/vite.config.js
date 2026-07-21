import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracion de Vite: se sirve bajo la ruta /registrar dentro del servidor unificado (3001)
export default defineConfig({
  base: '/registrar/', // imprescindible para que los assets carguen bajo /registrar
  plugins: [react()],
})
