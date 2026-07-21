# Función Filtrar/Listar (Vue 3 + Vite)

Frontend en **Vue 3 + Vite** que implementa la función **Filtrar/Listar** dentro
del proyecto unificado. Todo se sirve desde **un solo servidor (puerto 3001)**,
que expone la API y los 4 frontends compilados; esta función vive bajo la ruta **/filtrar**.

## Qué hace

- Lista todas las consultas (GET a `/api/consultas`) al montar.
- Filtra en memoria por estado (todos / pendiente / en proceso / resuelta) y por
  búsqueda de texto (estudiante o asunto).
- Elimina una consulta (DELETE) con confirmación.
- No crea ni edita: esas son otras funciones (otros frameworks) del proyecto unificado.

## Navegación

Registrar → /registrar | Editar → /editar | **Filtrar → /filtrar** | Estado → /estado

## Notas

- `vite.config.js` usa `base: '/filtrar/'` para que los assets carguen bien bajo esa ruta.
- La API se consume de forma relativa (`/api/consultas`), mismo origen y puerto (3001).
