# Backend — Servidor unificado (Etapas 1 y 2)

Servidor Node.js escrito en **TypeScript** que hace dos cosas en **un solo puerto (3001)**:

1. Expone la **API REST** de "consultas estudiantiles" (CRUD).
2. Sirve los **4 frontends compilados**, cada uno bajo una ruta = una función:
   `/registrar` (React), `/editar` (Angular), `/filtrar` (Vue), `/estado` (Next).

Usa el módulo `http` nativo de Node → **sin dependencias de ejecución** (ligero y rápido de instalar).

- **Etapa 1** (JavaScript + Node.js): base del servidor HTTP y el API REST.
- **Etapa 2** (Migración a TypeScript): interfaces y tipos (`ConsultaEstudiante`, `EstadoConsulta`, `ConsultaInput`).

> Se entrega una única versión ya migrada a TypeScript para no duplicar código.

## Normalmente se ejecuta desde la raíz

Lo habitual es correr todo el proyecto desde la carpeta raíz (`npm run dev`), que compila los frontends
y arranca este servidor. Ver el README principal.

## Ejecutar solo el backend (API)

```bash
cd backend
npm install
npm start        # arranca en http://localhost:3001
```

Si los frontends no están compilados, las rutas `/registrar`, `/editar`, etc. avisarán que falta `npm run build`.
El puerto se puede cambiar con la variable `PORT` (ej. PowerShell: `$env:PORT=3002; npm start`).

## Estructura

```
src/
├── types.ts       # Interfaces y tipos del modelo de datos
├── consultas.ts   # Lógica CRUD + almacén en memoria (controlador)
└── server.ts      # API REST + servido estático de los frontends
```

## Endpoints (`/api/consultas`)

| Método | Ruta                 | Descripción                  |
|--------|----------------------|------------------------------|
| GET    | `/api/consultas`     | Listar todas las consultas   |
| GET    | `/api/consultas/:id` | Obtener una consulta         |
| POST   | `/api/consultas`     | Crear una consulta           |
| PUT    | `/api/consultas/:id` | Actualizar una consulta      |
| DELETE | `/api/consultas/:id` | Eliminar una consulta        |

`estado` admite: `"pendiente"`, `"en proceso"` o `"resuelta"`.
