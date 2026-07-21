import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Config de Vite: base '/filtrar/' porque esta función se sirve bajo esa ruta
// en el servidor unificado (puerto 3001). base es imprescindible para los assets.
export default defineConfig({
  base: '/filtrar/',
  plugins: [vue()]
})
