# 🧭 Guía de Modificaciones — Consultas Estudiantiles

Guía práctica para **saber dónde tocar** cada parte del proyecto. Pensada para editar rápido
(por ejemplo, en clase o en un examen) sin perderte entre carpetas.

> **Idea clave:** este proyecto ya tiene implementado un modelo de `ConsultaEstudiante` con
> `categoria`, `urgencia` y `canal`, un buscador por texto en el backend, selects en el
> formulario y estilos de badges. Casi cualquier cambio es **adaptar algo que ya existe**.

---

## 1. Cómo correr el proyecto y VER los cambios

Todo se sirve en **un solo puerto: `http://localhost:3005`** (el backend además entrega los frontends compilados).

### Levantar el servidor
Desde la carpeta del proyecto (la que tiene `backend/`, `frontend-react/`, etc.):
```bash
npm start          # arranca solo el backend (usa los frontends ya compilados)
```
Verás `✅ Servidor Express unificado corriendo en http://localhost:3005`. Ábrelo en el navegador.
Login admin: **usuario `admin` · contraseña `admin123`**.

### ⚠️ Regla de oro al editar un FRONTEND (React, Vue, Angular)
El backend sirve la versión **compilada** (`dist/`), no tu código fuente directamente. Por eso,
si cambias algo en `frontend-react/src/...` **no se ve hasta recompilar**:
```bash
npm --prefix frontend-react run build   # recompila React
```
Luego **refresca** el navegador (`Ctrl + Shift + R`). Mismo patrón para `frontend-vue` y `frontend-angular`.

### 🚀 Modo rápido (opcional): editar React con recarga en vivo
Para no recompilar cada vez, corre el backend y **además** el servidor de desarrollo de React en otra terminal:
```bash
# Terminal 1
npm start
# Terminal 2
npm --prefix frontend-react run dev
```
Abre la URL que te dé Vite (termina en `/registrar/`). Los cambios se ven al instante (HMR) y las
llamadas `/api/...` se reenvían al backend automáticamente (ya está configurado el proxy en `vite.config.js`).

> El backend **no** necesita recompilarse: como usa TypeScript con `tsx`, al reiniciar (`Ctrl+C` y `npm start`) toma los cambios.

---

## 2. Mapa del proyecto (dónde está cada cosa)

```
backend/
  src/
    types.ts                     ← Interfaces/tipos de datos (ConsultaEstudiante)
    models/Consulta.ts           ← Esquema de la base de datos (campos guardados)
    routes/consultas.routes.ts   ← ENDPOINTS del API (GET, POST, PUT, DELETE, /buscar)
    consultas.ts                 ← Lógica: crear, actualizar, listar, eliminar, buscar
    server.ts                    ← Arranque, login (/api/auth/login), sirve los frontends
    config/db.ts                 ← Conexión a BD (o modo memoria si no hay Mongo)
frontend-react/                  ← Función REGISTRAR  → /registrar   (React + Hooks)
  src/
    App.jsx                      ← Formulario de registro (los selects viven aquí)
    components/PanelEstudiante.jsx ← Lista de tickets del estudiante (badges + useEffect + fetch)
    patterns/InputFactory.jsx    ← Componente reutilizable de inputs/selects
    index.css                    ← TODOS los estilos (badges, buscador, tarjetas...)
frontend-vue/                    ← Función FILTRAR/LISTAR → /filtrar
frontend-angular/                ← Función EDITAR → /editar
frontend-next/                   ← Función ESTADO → /estado
```

---

## 3. ¿Dónde modifico...? (tabla rápida)

| Quiero cambiar / agregar... | Archivo | Detalle |
|---|---|---|
| Campos del modelo de datos (tipos) | `backend/src/types.ts` | Interface `ConsultaEstudiante` (líneas ~6-22) |
| Campos que se guardan en la BD | `backend/src/models/Consulta.ts` | `ConsultaSchema` (líneas ~28-51) |
| Un endpoint del API (rutas) | `backend/src/routes/consultas.routes.ts` | GET/POST/PUT/DELETE + `/buscar` |
| Lógica de crear/editar/listar | `backend/src/consultas.ts` | Funciones `crear`, `actualizar`, `listar`... |
| Selects del formulario React | `frontend-react/src/App.jsx` | Paso 2 del formulario (líneas ~288-291) |
| Mostrar badges/emojis en la lista | `frontend-react/src/components/PanelEstudiante.jsx` | Render de cada consulta |
| Un buscador por texto | `frontend-react/src/components/PanelEstudiante.jsx` | `useState` + `useEffect` + `fetch` |
| Estilos (badges, buscador, colores) | `frontend-react/src/index.css` | Clases `.badge-*`, `.buscador-*`, `.resultados-count` |
| Usuario/clave del login | `backend/src/server.ts` | Endpoint `/api/auth/login` (`admin`/`admin123`) |

---

## 4. Recetas paso a paso

### 4.1. Modelo de datos: campos `categoria`, `urgencia`, `canal`
**Archivo:** `backend/src/types.ts`. Ya está así (union types = solo permite esos valores):
```ts
export interface ConsultaEstudiante {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: 'academica' | 'administrativa' | 'tecnica' | 'general';
  urgencia: 'inmediata' | 'urgente' | 'normal' | 'baja';
  canal: 'presencial' | 'email' | 'plataforma' | 'telefono';
  fechaCreacion: string;
  // ...otros campos
}
```
**Para agregar/quitar un valor:** edita la lista de la izquierda del `|` (ej. añadir `'reclamo'` a `categoria`).
**Para agregar un campo nuevo:** añádelo aquí Y en el esquema `backend/src/models/Consulta.ts` (para que se guarde).

### 4.2. Endpoint de búsqueda por texto `GET /api/consultas/buscar`
**Archivo:** `backend/src/routes/consultas.routes.ts`. Ya existe: recibe `?q=texto` y filtra por coincidencia.
El patrón esencial (búsqueda parcial, no exacta) es:
```js
api.get('/buscar', async (req, res) => {
  const { q } = req.query;                       // texto a buscar
  const todas = await consultas.listar();
  if (!q) return res.json(todas);                // sin texto → devuelve todas
  const texto = q.toString().toLowerCase();
  const resultado = todas.filter(c =>
    c.titulo.toLowerCase().includes(texto) ||    // busca en título
    c.descripcion.toLowerCase().includes(texto)  // ...o en descripción
  );
  res.json(resultado);
});
```
> Ojo: las rutas específicas como `/buscar` deben ir **antes** de `/:id`, si no `:id` las captura.

### 4.3. Formulario React con selects (`useState`)
**Archivo:** `frontend-react/src/App.jsx` (paso 2 del formulario). Usa el componente `InputFactory`
con `type="select"`. Ejemplo real ya presente:
```jsx
<InputFactory type="select" name="categoria" label="Categoría"
  value={form.categoria} onChange={cambiar}
  options={[
    { value: 'academica', label: '📚 Académica' },
    { value: 'administrativa', label: '📋 Administrativa' },
    { value: 'tecnica', label: '💻 Técnica' },
    { value: 'general', label: '📌 General' },
  ]} />
```
El estado del formulario se maneja con `useState` (variable `form`) y la función `cambiar`
actualiza el campo correspondiente. **Para agregar una opción:** añade un objeto `{ value, label }` al array `options`.

> Un `<select>` "a mano" equivalente sería:
> ```jsx
> const [categoria, setCategoria] = useState('general');
> <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
>   <option value="academica">📚 Académica</option>
>   ...
> </select>
> ```

### 4.4. Badges y emojis al mostrar cada consulta
**Archivo:** `frontend-react/src/components/PanelEstudiante.jsx`. Patrón: una función que mapea
valor → emoji/color, y `<span>` con la clase del badge:
```jsx
const getCategoriaEmoji = (cat) => ({ academica:'📚', administrativa:'📋', tecnica:'💻', general:'📌' }[cat] || '📌');
const getUrgenciaColor  = (u)   => ({ inmediata:'#ff1744', urgente:'#ff9100', normal:'#ffea00', baja:'#00e676' }[u] || '#999');

<div className="consulta-metadata">
  <span className="badge-categoria">{getCategoriaEmoji(c.categoria)} {c.categoria}</span>
  <span className="badge-urgencia" style={{ backgroundColor: getUrgenciaColor(c.urgencia) }}>⚡ {c.urgencia}</span>
  <span className="badge-canal">📡 {c.canal}</span>
</div>
```
Las clases `.badge-categoria`, `.badge-urgencia`, `.badge-canal` **ya están** en `index.css`.

### 4.5. Buscador con `useState` + `useEffect` + `fetch`
**Archivo:** `frontend-react/src/components/PanelEstudiante.jsx` (o donde tengas la lista).
Patrón completo:
```jsx
const [terminoBusqueda, setTerminoBusqueda] = useState('');
const [consultasFiltradas, setConsultasFiltradas] = useState([]);

useEffect(() => {
  const buscar = async () => {
    const url = terminoBusqueda.trim() === ''
      ? '/api/consultas'
      : `/api/consultas/buscar?q=${encodeURIComponent(terminoBusqueda)}`;
    const res = await fetch(url);
    setConsultasFiltradas(await res.json());
  };
  buscar();
}, [terminoBusqueda]);   // ← se re-ejecuta cada vez que cambia el texto

// En el JSX:
<div className="buscador-container">
  <input className="buscador-input" type="text" placeholder="🔍 Buscar consultas..."
    value={terminoBusqueda} onChange={(e) => setTerminoBusqueda(e.target.value)} />
  {terminoBusqueda && (
    <span className="resultados-count">{consultasFiltradas.length} resultados</span>
  )}
</div>
```

### 4.6. Estilos (badges y buscador)
**Archivo:** `frontend-react/src/index.css`. Ya contiene `.badge-categoria`, `.badge-urgencia`,
`.badge-canal`, `.buscador-container`, `.buscador-input`, `.buscador-input:focus`, `.resultados-count`.
Para cambiar colores/tamaños, edita esas reglas. Para un badge nuevo, copia el patrón de `.badge-canal`.

---

## 5. Flujo de datos (útil para entender / preguntas teóricas)

Cuando el usuario escribe **"proyecto"** en el buscador:

1. **Evento:** el `onChange` del `<input>` se dispara con cada tecla.
2. **Estado:** `setTerminoBusqueda("proyecto")` actualiza el `useState` `terminoBusqueda`.
3. **Efecto:** como `terminoBusqueda` está en el array de dependencias `[terminoBusqueda]`, se ejecuta el `useEffect`, que hace `fetch('/api/consultas/buscar?q=proyecto')`.
4. **Backend:** el endpoint `GET /api/consultas/buscar` (en `consultas.routes.ts`) filtra por coincidencia en `titulo`/`descripcion` y responde en **JSON**.
5. **UI:** `setConsultasFiltradas(data)` guarda los resultados; React **re-renderiza** la lista automáticamente y el contador muestra `data.length` resultados.

Resumen del recorrido: **onChange → useState → useEffect → fetch → endpoint → JSON → setState → re-render**.

---

## 6. Trabajar en StackBlitz (lee esto)

- **GitHub → StackBlitz NO es automático.** Abrir StackBlitz desde una URL de GitHub crea una
  **copia/foto** del repo en ese momento. Si luego haces `push` a GitHub, **no** aparece solo en
  una pestaña de StackBlitz ya abierta: hay que **volver a abrir** la URL para traer lo nuevo.
- **StackBlitz → GitHub tampoco es automático:** lo que edites en StackBlitz se queda en StackBlitz
  salvo que uses su integración de GitHub para hacer commit.
- **Para el examen** el entregable es el **enlace público de StackBlitz**, así que trabajas dentro
  de StackBlitz directamente (no necesitas GitHub para entregar).
- En StackBlitz, para arrancar usa **`npm start`** (no `npm run dev`: ese usa `turbo`, que no
  funciona en StackBlitz). Y recuerda **recompilar el frontend** que edites (`npm --prefix frontend-react run build`).

---

### Credenciales y datos
- **Admin:** `admin` / `admin123`.
- **Estudiante:** nombre del estudiante + su DNI (debe existir una consulta registrada con ese DNI).
- Sin MongoDB, los datos viven **en memoria** y se reinician al reiniciar el servidor
  (se precarga 1 consulta de ejemplo desde `backend/db.json`).
