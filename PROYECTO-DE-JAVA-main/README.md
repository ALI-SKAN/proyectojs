# Proyecto Integral JavaScript — Consultas Estudiantiles

Sistema de gestión de **consultas estudiantiles** construido por etapas para practicar todo el stack de
JavaScript moderno. **Todo corre en UN SOLO servidor y UN SOLO puerto (3001):** el backend sirve la API
REST y los 4 frontends compilados, y **cada framework cumple una función distinta** del sistema.

Todos comparten **el mismo backend, el mismo modelo de datos y la misma API** → sin lógica duplicada.

## Etapas y funciones

| Etapa | Framework | Función | Ruta (todo en `localhost:3001`) |
|-------|-----------|---------|--------------------------------|
| 1 y 2 | Node.js + TypeScript | API REST + servidor unificado | `/api/consultas` |
| 4     | React + Hooks | **Registrar** consultas (crear) | `/registrar` |
| 3     | Angular + HttpClient | **Editar / actualizar** | `/editar` |
| 5     | Vue 3 | **Filtrar / listar** (+ eliminar) | `/filtrar` |
| 6     | Next.js | **Estado** público de consultas | `/estado` |

Una **barra de navegación común** en cada frontend permite moverse entre las 4 funciones.

> **Etapas 1 y 2:** el backend se entrega ya migrado a TypeScript (una sola versión) para no duplicar
> código. La Etapa 1 es la base del servidor y el API REST; la Etapa 2 añade tipos e interfaces.

## Cómo empezar (un solo comando)

Desde la **carpeta raíz** del proyecto:

```bash
npm install     # instala el backend y los 4 frontends de una vez
npm run dev     # compila los 4 frontends y arranca el servidor unificado
```

Luego abre **http://localhost:3001** (redirige a `/registrar`). Desde la barra superior entras a cada función.
Para detener: `Ctrl + C`.

> Después de instalar, si ya compilaste antes, puedes usar solo `npm start` (arranca el servidor sin recompilar).
> Si cambias el código de un frontend, vuelve a ejecutar `npm run build` (o `npm run dev`) para ver los cambios.

### ¿Por qué se compilan los frontends?

React, Angular, Vue y Next.js son 4 frameworks incompatibles entre sí: no pueden ejecutarse a la vez como
una sola app. La solución es **compilar cada uno** y que el backend los sirva como archivos estáticos, cada
uno bajo su ruta. Así se logra "todo en un solo puerto". Next.js se exporta estático (`output: 'export'`).

## Modelo de datos (compartido)

```ts
interface ConsultaEstudiante {
  id: number;
  estudiante: string;
  asunto: string;
  mensaje: string;
  estado: 'pendiente' | 'en proceso' | 'resuelta';
  fecha: string; // ISO
}
```

## API REST (`http://localhost:3001/api/consultas`)

| Método | Ruta                 | Descripción                |
|--------|----------------------|----------------------------|
| GET    | `/api/consultas`     | Listar todas               |
| GET    | `/api/consultas/:id` | Obtener una                |
| POST   | `/api/consultas`     | Crear                      |
| PUT    | `/api/consultas/:id` | Actualizar                 |
| DELETE | `/api/consultas/:id` | Eliminar                   |

## Estructura

```
backend/            Servidor Node+TS: API REST + sirve los 4 frontends compilados
frontend-react/     Función Registrar  → /registrar
frontend-angular/   Función Editar     → /editar
frontend-vue/       Función Filtrar    → /filtrar
frontend-next/      Función Estado     → /estado
package.json        Orquestador: install / build / start de todo
```

## Notas para GitHub y StackBlitz

- `node_modules/` y las carpetas de build (`dist`, `.next`, `out`, `.angular`) están en `.gitignore`, por eso
  el repositorio es **ligero**. Al clonar/abrir, ejecuta `npm install` y luego `npm run dev`.
- Los datos del backend viven **en memoria** (sin base de datos): se reinician al reiniciar el servidor.

_Faltan las etapas 7 y 8 (se agregarán más adelante)._
