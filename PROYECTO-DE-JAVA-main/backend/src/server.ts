import express from 'express';
import cors from 'cors';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import jwt from 'jsonwebtoken';
import { connectDatabases } from './config/db';
import * as consultas from './consultas';
import { ConsultaModel } from './models/Consulta';
import { authMiddleware, sseClients, JWT_SECRET } from './shared';

const app = express();
const PORT = Number(process.env.PORT) || 3005;

// Middlewares globales
app.use(cors({
  origin: true, // Permitir cualquier origen
  credentials: true // Permitir el envío de cookies
}));
app.use(express.json());

interface UserBlockStatus {
  attempts: number;
  blockCycles: number;
  lockUntil: number | null;
  permanentBlock: boolean;
}

const userStatuses = new Map<string, UserBlockStatus>();

// Endpoint de login para obtener token (y guardarlo en cookie HttpOnly)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Usuario requerido' });
  }

  let status = userStatuses.get(username);
  if (!status) {
    status = { attempts: 0, blockCycles: 0, lockUntil: null, permanentBlock: false };
    userStatuses.set(username, status);
  }

  if (status.permanentBlock) {
    return res.status(403).json({ error: 'Cuenta bloqueada permanentemente.' });
  }

  if (status.lockUntil && Date.now() < status.lockUntil) {
    const remainingSeconds = Math.ceil((status.lockUntil - Date.now()) / 1000);
    return res.status(403).json({ error: `Cuenta bloqueada temporalmente. Intente en ${remainingSeconds} segundos.` });
  } else if (status.lockUntil && Date.now() >= status.lockUntil) {
    status.lockUntil = null;
    status.attempts = 0;
  }

  let isAuthenticated = false;
  let role = '';
  let dni = '';

  if (username === 'admin' && password === 'admin123') {
    isAuthenticated = true;
    role = 'admin';
  } else {
    // Verificación para estudiantes (username = estudiante, password = dni)
    const estudianteQuery = await ConsultaModel.findOne({ estudiante: username, dni: password }).lean();
    if (estudianteQuery) {
      isAuthenticated = true;
      role = 'estudiante';
      dni = password;
    }
  }

  if (isAuthenticated) {
    userStatuses.delete(username);
    const payload: any = { username, role };
    if (role === 'estudiante') payload.dni = dni;
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '2h' });
    res.setHeader('Set-Cookie', `token=${token}; HttpOnly; Path=/; Max-Age=7200; SameSite=Lax`);
    return res.json({ token, role, dni });
  }

  status.attempts++;
  if (status.attempts >= 3) {
    status.blockCycles++;
    if (status.blockCycles >= 3) {
      status.permanentBlock = true;
      return res.status(403).json({ error: 'Cuenta bloqueada permanentemente.' });
    } else {
      status.lockUntil = Date.now() + 5 * 60 * 1000; // 5 minutos de bloqueo
      return res.status(403).json({ error: 'Demasiados intentos. Cuenta bloqueada por 5 minutos.' });
    }
  }

  res.status(401).json({ error: `Usuario o contraseña incorrectos. Intento ${status.attempts} de 3.` });
});

// Endpoint para verificar estado de autenticación actual
app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  res.json({ username: req.user.username, role: req.user.role, dni: req.user.dni });
});

// Endpoint de logout para limpiar la cookie HttpOnly
app.post('/api/auth/logout', (req, res) => {
  res.setHeader('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax');
  res.json({ mensaje: 'Sesión cerrada' });
});

import consultasRoutes from './routes/consultas.routes';

app.use('/api/consultas', consultasRoutes);

// Servir estáticos
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const angularPathBrowser = join(ROOT, 'frontend-angular', 'dist', 'frontend-angular', 'browser');
const angularPathRoot = join(ROOT, 'frontend-angular', 'dist', 'frontend-angular');
const angularDir = existsSync(angularPathBrowser) ? angularPathBrowser : angularPathRoot;

const MOUNTS = [
  { prefix: '/registrar', dir: join(ROOT, 'frontend-react', 'dist') },
  { prefix: '/editar',    dir: angularDir },
  { prefix: '/filtrar',   dir: join(ROOT, 'frontend-vue', 'dist') },
  { prefix: '/estado',    dir: join(ROOT, 'frontend-next', 'out') },
];

MOUNTS.forEach(({ prefix, dir }) => {
  // Sirve los archivos estáticos sin guardar en caché
  app.use(prefix, express.static(dir, {
    etag: false,
    maxAge: 0,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }));
  // Fallback para SPA routing sin guardar en caché
  app.use(prefix, (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(join(dir, 'index.html'));
  });
});

app.get('/', (req, res) => {
  res.redirect('/registrar');
});

// Manejo de 404 global
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/proyectoIntegralDB';

connectDatabases().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Servidor Express unificado corriendo en http://localhost:${PORT}`);
    console.log(`   /registrar (React) · /editar (Angular) · /filtrar (Vue) · /estado (Next)`);
    console.log(`   API REST: http://localhost:${PORT}/api/consultas`);
  });
}).catch(err => {
  console.error('❌ Error fatal al iniciar el servidor:', err);
});
