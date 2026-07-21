# Frontend React - Funcion "Registrar"

Frontend en **React + Vite** que implementa la funcion **Registrar** dentro del
proyecto unificado. Todo el sistema corre en **un solo servidor (puerto 3001)**
que sirve la API y los 4 frontends compilados; esta app se sirve bajo la ruta
**/registrar**.

Permite registrar una nueva consulta (POST) y muestra debajo las ultimas
consultas registradas (GET, solo lectura). Usa los Hooks `useState` (formulario,
lista y mensaje) y `useEffect` (carga inicial y refresco tras registrar).

## Detalles

- Ruta de servido: **/registrar** (`base: '/registrar/'` en `vite.config.js`).
- API relativa (mismo origen y puerto): `/api/consultas`.
- Sin editar, eliminar ni filtrar (esas son otras funciones/frameworks).

## Como compilar

```bash
npm install
npm run build
```

El resultado compilado se integra en el servidor unificado (puerto 3001) bajo
la ruta `/registrar`.
