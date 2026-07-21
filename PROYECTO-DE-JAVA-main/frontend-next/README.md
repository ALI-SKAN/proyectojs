# Frontend Next.js - Funcion "Estado"

Vista publica del **estado** de las solicitudes de estudiantes. Es una de las
4 funciones del proyecto unificado y se sirve bajo la ruta **/estado**.

En el modo unificado, **un solo servidor (puerto 3001)** sirve la API y los 4
frontends compilados. Por eso esta app Next.js se **exporta como estatico**
(`output: 'export'` con `basePath: '/estado'`, ver `next.config.mjs`) y genera
la carpeta `out/`.

Al ser estatico, **no hay SSR en vivo por request**: la pagina es un Client
Component (`'use client'`) que hace `fetch('/api/consultas')` en el cliente
(mismo origen/puerto) para mostrar siempre datos en vivo.

## Pagina

- `/estado` : lista publica de consultas con su estado (badge de color). Al
  hacer clic en una consulta se muestra su detalle (estudiante, asunto, mensaje,
  estado, fecha) en la misma pagina usando estado de cliente (`useState`).
  No se usan rutas dinamicas (incompatibles con el export estatico).

## Navegacion entre funciones

Barra superior con enlaces absolutos hacia las otras apps:
`/registrar`, `/editar`, `/filtrar`, `/estado` (activa).

## Compilar

```bash
npm install
npm run build
```

`next build` con `output: 'export'` genera la carpeta `out/`, que el servidor
unificado (puerto 3001) sirve de forma estatica bajo `/estado`.
