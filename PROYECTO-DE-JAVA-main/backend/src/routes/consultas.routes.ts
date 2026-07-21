import { Router } from 'express';
import * as consultas from '../consultas';
import { ConsultaModel } from '../models/Consulta';
import { authMiddleware, broadcast } from '../shared';

const api = Router();

api.get('/', async (req, res) => {
  res.json(await consultas.listar());
});

api.get('/mis-tickets', authMiddleware, async (req: any, res) => {
  if (req.user.role !== 'estudiante') {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  const tickets = await ConsultaModel.find({ dni: req.user.dni }).sort({ fechaCreacion: -1 }).lean();
  res.json(tickets);
});

api.get('/siguiente-ticket', (req, res) => {
  try {
    const id = consultas.obtenerSiguienteTicketId();
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

api.get('/buscar', async (req, res) => {
  const { q } = req.query;
  const todas = await consultas.listar();
  if (!q) {
    return res.json(todas);
  }
  const queryText = q.toString().toLowerCase();
  const filtradas = todas.filter((c: any) => {
    const fieldsToSearch = [
      c.titulo, c.descripcion, c.estudiante, c.categoria,
      c.urgencia, c.canal, c.fechaCreacion, c.fechaActualizacion
    ];
    return fieldsToSearch.some(field => field && field.toString().toLowerCase().includes(queryText));
  });
  res.json(filtradas);
});

api.get('/:id', async (req, res) => {
  if (req.params.id === 'stream' || req.params.id === 'buscar-bst' || req.params.id === 'cola') {
    return; // Pass to next handler
  }
  const c = await consultas.obtener(req.params.id);
  if (c) res.json(c);
  else res.status(404).json({ error: 'No encontrada' });
});

api.post('/', authMiddleware, async (req, res) => {
  try {
    const c = await consultas.crear(req.body);
    broadcast('create', c);
    res.status(201).json(c);
  } catch (error) {
    res.status(400).json({ error: 'Datos inválidos' });
  }
});

api.put('/:id', authMiddleware, async (req, res) => {
  try {
    const c = await consultas.actualizar(req.params.id, req.body);
    broadcast('update', c);
    res.json(c);
  } catch (error) {
    res.status(404).json({ error: 'No encontrada o datos inválidos' });
  }
});

api.delete('/:id', authMiddleware, async (req, res) => {
  const ok = await consultas.eliminar(req.params.id);
  if (ok) {
    broadcast('delete', { id: req.params.id });
    res.json({ mensaje: 'Eliminada' });
  }
  else res.status(404).json({ error: 'No encontrada' });
});

export default api;
