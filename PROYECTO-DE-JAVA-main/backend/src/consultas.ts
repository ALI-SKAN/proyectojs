import { Pila } from './estructuras/Pila';
import { ColaPrioridad } from './estructuras/ColaPrioridad';
import { BST } from './estructuras/BST';
import { campusGraph } from './estructuras/GrafoCampus';
import { ConsultaModel } from './models/Consulta';
import { redisClient, cassandraClient } from './config/db';

// Pila global para almacenar el historial de cambios (Undo / Deshacer)
// (Permanece en memoria, se reinicia al reiniciar el servidor)
const pilaHistorial = new Pila<any>();

export const listar = async () => {
  try {
    const cached = await redisClient.get('consultas:listar');
    if (cached) return JSON.parse(cached);
  } catch (e) { console.error('Redis Error', e); }

  const list = await ConsultaModel.find().sort({ fechaCreacion: -1 }).lean();
  
  try {
    await redisClient.setEx('consultas:listar', 30, JSON.stringify(list));
  } catch (e) { console.error('Redis Error', e); }
  
  return list;
};

export const obtener = async (id: string) => {
  return await ConsultaModel.findOne({ id }).lean();
};

export const obtenerSiguienteTicketId = async () => {
  const ahora = new Date();
  const dia = ahora.getDate();
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();
  
  const deHoy = await ConsultaModel.find({ fechaCreacion: { $gte: inicioHoy } }).lean();
  let turno = deHoy.length + 1;
  let ticketId = `${dia}${turno.toString().padStart(2, '0')}`;
  
  while (await ConsultaModel.exists({ id: ticketId })) {
    turno++;
    ticketId = `${dia}${turno.toString().padStart(2, '0')}`;
  }
  return ticketId;
};

export const crear = async (datos: any) => {
  const titulo = datos.titulo || datos.asunto || '';
  const descripcion = datos.descripcion || datos.mensaje || '';
  const categoriaOriginal = datos.categoria || 'general';
  const urgencia = datos.urgencia || 'normal';
  const canal = datos.canal || 'plataforma';

  // Validación de unicidad
  if (datos.dni || datos.telefono || datos.correo) {
    const existe = await ConsultaModel.findOne({
      $or: [
        ...(datos.dni ? [{ dni: datos.dni }] : []),
        ...(datos.telefono ? [{ telefono: datos.telefono }] : []),
        ...(datos.correo ? [{ correo: datos.correo }] : [])
      ]
    }).lean();

    if (existe) {
      if (existe.dni === datos.dni) throw new Error("Ya existe una consulta registrada con este DNI.");
      if (existe.telefono === datos.telefono) throw new Error("Ya existe una consulta registrada con este Celular.");
      if (existe.correo === datos.correo) throw new Error("Ya existe una consulta registrada con este Correo Electrónico.");
    }
  }

  // 1. Motor de Clasificación Local NLP (Sugerencia / Auto-clasificación)
  let categoria = categoriaOriginal;
  if (categoria === 'general' && descripcion) {
    const descLower = descripcion.toLowerCase();
    if (descLower.includes('servidor') || descLower.includes('error') || descLower.includes('codigo') || descLower.includes('código') || descLower.includes('plataforma') || descLower.includes('no carga') || descLower.includes('web') || descLower.includes('bug')) {
      categoria = 'tecnica';
    } else if (descLower.includes('matricula') || descLower.includes('matrícula') || descLower.includes('pago') || descLower.includes('recibo') || descLower.includes('pension') || descLower.includes('pensión') || descLower.includes('costo') || descLower.includes('tramite') || descLower.includes('trámite')) {
      categoria = 'administrativa';
    } else if (descLower.includes('examen') || descLower.includes('nota') || descLower.includes('profesor') || descLower.includes('docente') || descLower.includes('curso') || descLower.includes('materia') || descLower.includes('clase')) {
      categoria = 'academica';
    }
  }

  // 2. Auto-Resumen IA NLP
  let resumenIA = '';
  if (descripcion) {
    const limpio = descripcion.replace(/\s+/g, ' ').trim();
    const primerPunto = limpio.indexOf('.');
    const extracto = primerPunto > 10 && primerPunto < 80 
      ? limpio.substring(0, primerPunto + 1) 
      : limpio.substring(0, 70) + (limpio.length > 70 ? '...' : '');
    resumenIA = `${extracto}`;
  }

  // 3. Cálculo de SLA
  const calcularSLALimite = (urgenciaVal: string) => {
    const ahora = new Date();
    if (urgenciaVal === 'inmediata') ahora.setHours(ahora.getHours() + 2);
    else if (urgenciaVal === 'urgente') ahora.setHours(ahora.getHours() + 8);
    else if (urgenciaVal === 'normal') ahora.setHours(ahora.getHours() + 24);
    else ahora.setHours(ahora.getHours() + 48); // baja
    return ahora.toISOString();
  };
  const slaLimite = calcularSLALimite(urgencia);
  
  const ticketId = await obtenerSiguienteTicketId();
  const fechaActual = new Date().toISOString();
  
  const nuevaConsulta = new ConsultaModel({
    id: ticketId,
    estudiante: datos.estudiante || '',
    dni: datos.dni || '',
    telefono: datos.telefono || '',
    correo: datos.correo || '',
    titulo,
    asunto: titulo, // retrocompatibilidad
    descripcion,
    mensaje: descripcion, // retrocompatibilidad
    categoria,
    urgencia,
    prioridad: urgencia === 'inmediata' || urgencia === 'urgente' ? 'Alta' : (urgencia === 'normal' ? 'Media' : 'Baja'),
    estado: 'pendiente',
    canal,
    resumenIA,
    adjuntoBase64: datos.adjuntoBase64 || '',
    adjuntoNombre: datos.adjuntoNombre || '',
    slaLimite,
    fechaCreacion: fechaActual,
    fecha: fechaActual, // retrocompatibilidad
    fechaActualizacion: fechaActual,
    historial: [
      {
        fecha: fechaActual,
        accion: "🚀 Creado",
        descripcion: `Consulta registrada por ${datos.estudiante || 'Estudiante'} vía ${canal}.${categoriaOriginal !== categoria ? ` (Auto-categorizado a ${categoria})` : ''}`
      }
    ]
  });

  await nuevaConsulta.save();
  try { await redisClient.del('consultas:listar'); } catch(e){}
  
  // Guardar copia en Cassandra (Big Data / Histórico)
  try {
    const cql = `
      INSERT INTO consultas (
        id, estudiante, dni, telefono, correo, titulo, descripcion, categoria, 
        urgencia, prioridad, estado, canal, resumenia, adjuntonombre, slalimite, 
        historial, fecha_creacion, fecha_modificacion
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      ticketId, 
      datos.estudiante || '', 
      datos.dni || '', 
      datos.telefono || '',
      datos.correo || '',
      titulo, 
      descripcion, 
      categoria, 
      urgencia,
      nuevaConsulta.prioridad,
      'pendiente', 
      canal,
      resumenIA,
      datos.adjuntoNombre || '',
      slaLimite,
      JSON.stringify(nuevaConsulta.historial),
      new Date(fechaActual),
      new Date(fechaActual)
    ];
    await cassandraClient.execute(cql, params, { prepare: true });
  } catch (err: any) {
    console.error('Error guardando en Cassandra:', err.message);
  }

  return nuevaConsulta.toObject();
};

export const actualizar = async (id: string, datos: any) => {
  const anterior = await ConsultaModel.findOne({ id }).lean();
  if (!anterior) throw new Error("No encontrado");
  
  // Guardar copia profunda en pila de historial
  pilaHistorial.push(JSON.parse(JSON.stringify(anterior)));

  const titulo = datos.titulo || datos.asunto || anterior.titulo;
  const descripcion = datos.descripcion || datos.mensaje || anterior.descripcion;
  
  const cambios: string[] = [];
  if (datos.estudiante && datos.estudiante !== anterior.estudiante) cambios.push(`Estudiante cambiado a "${datos.estudiante}"`);
  if (datos.dni !== undefined && datos.dni !== anterior.dni) cambios.push(`DNI modificado`);
  if (datos.titulo && datos.titulo !== anterior.titulo) cambios.push(`Título modificado`);
  if (datos.descripcion && datos.descripcion !== anterior.descripcion) cambios.push(`Descripción modificada`);
  if (datos.categoria && datos.categoria !== anterior.categoria) cambios.push(`Categoría: de "${anterior.categoria}" a "${datos.categoria}"`);
  if (datos.canal && datos.canal !== anterior.canal) cambios.push(`Canal: de "${anterior.canal}" a "${datos.canal}"`);
  if (datos.telefono !== undefined && datos.telefono !== anterior.telefono) cambios.push(`Teléfono modificado`);
  if (datos.correo !== undefined && datos.correo !== anterior.correo) cambios.push(`Correo modificado`);
  if (datos.adjuntoBase64 !== undefined && datos.adjuntoBase64 !== anterior.adjuntoBase64) cambios.push(`Adjunto actualizado`);

  let slaLimite = anterior.slaLimite;
  if (datos.urgencia && datos.urgencia !== anterior.urgencia) {
    cambios.push(`Urgencia: de "${anterior.urgencia}" a "${datos.urgencia}"`);
    const ahora = new Date();
    if (datos.urgencia === 'inmediata') ahora.setHours(ahora.getHours() + 2);
    else if (datos.urgencia === 'urgente') ahora.setHours(ahora.getHours() + 8);
    else if (datos.urgencia === 'normal') ahora.setHours(ahora.getHours() + 24);
    else ahora.setHours(ahora.getHours() + 48);
    slaLimite = ahora.toISOString();
  }

  // Recalcular resumenIA si cambia la descripción
  let resumenIA = anterior.resumenIA;
  if (datos.descripcion && datos.descripcion !== anterior.descripcion) {
    const limpio = datos.descripcion.replace(/\s+/g, ' ').trim();
    const primerPunto = limpio.indexOf('.');
    const extracto = primerPunto > 10 && primerPunto < 80 
      ? limpio.substring(0, primerPunto + 1) 
      : limpio.substring(0, 70) + (limpio.length > 70 ? '...' : '');
    resumenIA = `${extracto}`;
  }

  const historial = [...(anterior.historial || [])];
  if (datos.estado && datos.estado !== anterior.estado) {
    cambios.push(`Estado: de "${anterior.estado}" a "${datos.estado}"`);
  }

  if (cambios.length > 0) {
    historial.push({
      fecha: new Date().toISOString(),
      accion: "✏️ Modificado",
      descripcion: cambios.join(', ')
    });
  }

  if (datos.notaAgente) {
    historial.push({
      fecha: new Date().toISOString(),
      accion: "💬 Nota de Agente",
      descripcion: datos.notaAgente
    });
  }

  const actualizada = await ConsultaModel.findOneAndUpdate(
    { id },
    { 
      ...datos, 
      titulo,
      asunto: titulo,
      descripcion,
      mensaje: descripcion,
      resumenIA,
      slaLimite,
      fechaActualizacion: new Date().toISOString(),
      historial
    },
    { new: true }
  ).lean();
  
  // Actualizar también en Cassandra
  try {
    const cql = `
      UPDATE consultas
      SET estudiante = ?, dni = ?, telefono = ?, correo = ?, titulo = ?, descripcion = ?, 
          categoria = ?, urgencia = ?, prioridad = ?, estado = ?, canal = ?, resumenia = ?, 
          slalimite = ?, historial = ?, fecha_modificacion = ?
      WHERE id = ?
    `;
    const params = [
      datos.estudiante || anterior.estudiante || '',
      datos.dni || anterior.dni || '',
      datos.telefono || anterior.telefono || '',
      datos.correo || anterior.correo || '',
      titulo,
      descripcion,
      datos.categoria || anterior.categoria || '',
      datos.urgencia || anterior.urgencia || '',
      actualizada?.prioridad || anterior.prioridad || '',
      datos.estado || anterior.estado || 'pendiente',
      datos.canal || anterior.canal || '',
      resumenIA,
      slaLimite,
      JSON.stringify(historial),
      new Date(), // fecha_modificacion
      id
    ];
    await cassandraClient.execute(cql, params, { prepare: true });
  } catch (err: any) {
    console.error('Error actualizando en Cassandra:', err.message);
  }

  try { await redisClient.del('consultas:listar'); } catch(e){}
  return actualizada;
};

export const eliminar = async (id: string) => {
  try {
    const deleted = await ConsultaModel.findOneAndDelete({ id });
    if (deleted) {
      try { await redisClient.del('consultas:listar'); } catch(e){}
    }
    return !!deleted;
  } catch {
    return false;
  }
};

// ==========================================
// FUNCIONES DE ESTRUCTURAS DE DATOS PROPIAS
// ==========================================

// 1. DESHACER ÚLTIMO CAMBIO (PILA)
export const deshacerUltimoCambio = async () => {
  if (pilaHistorial.isEmpty()) {
    throw new Error("No hay modificaciones registradas para deshacer.");
  }
  const estadoAnterior = pilaHistorial.pop();
  
  estadoAnterior.historial.push({
    fecha: new Date().toISOString(),
    accion: "🔄 Deshecho",
    descripcion: "Se revirtió la última operación para retornar a este estado."
  });

  const restaurado = await ConsultaModel.findOneAndUpdate(
    { id: estadoAnterior.id },
    estadoAnterior,
    { new: true }
  ).lean();

  if (!restaurado) {
    throw new Error("El ticket que se intentaba restaurar ya no existe en el sistema.");
  }
  try { await redisClient.del('consultas:listar'); } catch(e){}
  return restaurado;
};

// 2. OBTENER COLA DE ATENCIÓN POR PRIORIDAD
export const obtenerColaAtencion = async () => {
  const pendientes = await ConsultaModel.find({ estado: 'pendiente' })
    .sort({ fechaCreacion: 1 })
    .lean();
    
  const cola = new ColaPrioridad<any>();
  
  pendientes.forEach((c: any) => {
    let prioridad = 3; // normal por defecto
    if (c.urgencia === 'inmediata') prioridad = 1;
    else if (c.urgencia === 'urgente') prioridad = 2;
    else if (c.urgencia === 'normal') prioridad = 3;
    else if (c.urgencia === 'baja') prioridad = 4;
    
    cola.enqueue(c, prioridad, new Date(c.fechaCreacion));
  });
  
  return cola;
};

// 3. ATENDER TICKET SIGUIENTE DE LA COLA (Prioritario FIFO)
export const atenderSiguienteTicket = async () => {
  const cola = await obtenerColaAtencion();
  if (cola.isEmpty()) {
    throw new Error("No hay tickets pendientes en la cola de atención.");
  }
  const siguiente = cola.dequeue();
  
  const anterior = await ConsultaModel.findOne({ id: siguiente.id }).lean();
  if (!anterior) {
    throw new Error("Error interno al atender el ticket.");
  }

  pilaHistorial.push(JSON.parse(JSON.stringify(anterior)));

  const historial = [...(anterior.historial || [])];
  historial.push({
    fecha: new Date().toISOString(),
    accion: "⚙️ Atendido",
    descripcion: "Ticket desencolado de la Cola de Prioridades y asignado para atención."
  });

  const actualizado = await ConsultaModel.findOneAndUpdate(
    { id: siguiente.id },
    {
      estado: 'en proceso',
      fechaActualizacion: new Date().toISOString(),
      historial
    },
    { new: true }
  ).lean();

  try { await redisClient.del('consultas:listar'); } catch(e){}
  return actualizado;
};

// 4. BÚSQUEDA BINARIA INDEXADA (BST)
export const buscarConBST = async (termino: string) => {
  const todas = await ConsultaModel.find().lean();
  const arbol = new BST<any>();
  
  todas.forEach((c: any) => {
    arbol.insert(c.estudiante, c);
  });
  
  return arbol.buscarCoincidencias(termino);
};

// 5. RUTA MÁS CORTA DEL CAMPUS (GRAFO + DIJKSTRA)
export const obtenerRutaOficina = async (ticketId: string) => {
  const ticket = await ConsultaModel.findOne({ id: ticketId }).lean();
  if (!ticket) throw new Error("Consulta no encontrada.");
  
  const categoria = ticket.categoria || 'general';
  let destino = 'Oficina Central (Informes)';
  if (categoria === 'tecnica') destino = 'Pabellón C (Sistemas)';
  else if (categoria === 'academica') destino = 'Pabellón B (Bienestar)';
  else if (categoria === 'administrativa') destino = 'Pabellón A (Secretaría)';
  
  const resultadoDijkstra = campusGraph.obtenerRutaMasCorta('Ingreso Principal', destino);
  
  return {
    ticketId,
    categoria,
    oficinaAsignada: destino,
    ruta: resultadoDijkstra.ruta,
    distanciaMetros: resultadoDijkstra.distancia,
    mapaEnlaces: campusGraph.getMapaCompleto()
  };
};
