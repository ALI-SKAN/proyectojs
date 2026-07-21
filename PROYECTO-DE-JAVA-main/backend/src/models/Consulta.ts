import mongoose, { Schema, Document } from 'mongoose';

export interface IConsulta extends Document {
  id: string; // Maintain the existing string ID for backwards compatibility
  estudiante: string;
  dni?: string;
  telefono?: string;
  correo?: string;
  titulo: string;
  asunto: string;
  descripcion: string;
  mensaje: string;
  categoria: string;
  urgencia: string;
  prioridad: string;
  estado: string;
  canal: string;
  resumenIA?: string;
  adjuntoBase64?: string;
  adjuntoNombre?: string;
  slaLimite?: string;
  fechaCreacion: string;
  fecha: string;
  fechaActualizacion: string;
  historial: any[];
}

const ConsultaSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  estudiante: { type: String, required: true },
  dni: { type: String },
  telefono: { type: String },
  correo: { type: String },
  titulo: { type: String },
  asunto: { type: String },
  descripcion: { type: String },
  mensaje: { type: String },
  categoria: { type: String },
  urgencia: { type: String },
  prioridad: { type: String },
  estado: { type: String },
  canal: { type: String },
  resumenIA: { type: String },
  adjuntoBase64: { type: String },
  adjuntoNombre: { type: String },
  slaLimite: { type: String },
  fechaCreacion: { type: String },
  fecha: { type: String },
  fechaActualizacion: { type: String },
  historial: { type: Array, default: [] }
});

// Modelo real de Mongoose (se usa si MongoDB está disponible)
const MongooseConsulta = mongoose.model<IConsulta>('Consulta', ConsultaSchema);

// ============================================================================
//  ALMACÉN EN MEMORIA (fallback cuando no hay MongoDB)
//  Reimplementa SOLO los métodos de Mongoose que el proyecto realmente usa.
// ============================================================================

let memoryMode = false;
export const setMemoryMode = (v: boolean) => { memoryMode = v; };
export const isMemoryMode = () => memoryMode;

const store: any[] = [];

/** Carga datos iniciales en el almacén en memoria (desde db.json). */
export const seedMemory = (docs: any[]) => {
  store.length = 0;
  for (const d of docs) store.push({ ...d });
};

/** Evalúa si un documento cumple un filtro estilo Mongo (=, $or, $gte/$lte/$gt/$lt/$ne/$in). */
function matches(doc: any, filter: any): boolean {
  for (const key of Object.keys(filter || {})) {
    if (key === '$or') {
      if (!filter.$or.some((f: any) => matches(doc, f))) return false;
      continue;
    }
    const cond = filter[key];
    if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
      if ('$gte' in cond && !(doc[key] >= cond.$gte)) return false;
      if ('$lte' in cond && !(doc[key] <= cond.$lte)) return false;
      if ('$gt' in cond && !(doc[key] > cond.$gt)) return false;
      if ('$lt' in cond && !(doc[key] < cond.$lt)) return false;
      if ('$ne' in cond && !(doc[key] !== cond.$ne)) return false;
      if ('$in' in cond && !cond.$in.includes(doc[key])) return false;
    } else if (doc[key] !== cond) {
      return false;
    }
  }
  return true;
}

// Query encadenable para find() → soporta .sort(...).lean() o directamente await/.lean()
class MemQuery {
  private results: any[];
  constructor(results: any[]) { this.results = results; }
  sort(spec: any) {
    const [field, dir] = Object.entries(spec)[0] as [string, number];
    this.results = [...this.results].sort((a, b) => {
      const av = a[field], bv = b[field];
      if (av < bv) return dir === 1 ? -1 : 1;
      if (av > bv) return dir === 1 ? 1 : -1;
      return 0;
    });
    return this;
  }
  lean() { return Promise.resolve(this.results.map(d => ({ ...d }))); }
  then(res: any, rej?: any) { return this.lean().then(res, rej); }
}

// Query para findOne()/findOneAndUpdate() → soporta .lean() o await directo
class MemSingle {
  private doc: any;
  constructor(doc: any) { this.doc = doc; }
  lean() { return Promise.resolve(this.doc ? { ...this.doc } : null); }
  then(res: any, rej?: any) { return this.lean().then(res, rej); }
}

// Instancia de documento en memoria → soporta new + .save() + .toObject()
class MemDoc {
  constructor(data: any) { Object.assign(this, data); }
  async save() { store.push({ ...this }); return this; }
  toObject() { return { ...this }; }
}

const MemoryConsulta: any = {
  find(filter: any = {}) {
    return new MemQuery(store.filter(d => matches(d, filter)));
  },
  findOne(filter: any = {}) {
    return new MemSingle(store.find(d => matches(d, filter)) || null);
  },
  async exists(filter: any) {
    return store.some(d => matches(d, filter)) ? { _id: 'mem' } : null;
  },
  findOneAndUpdate(filter: any, update: any, _opts?: any) {
    const idx = store.findIndex(d => matches(d, filter));
    if (idx === -1) return new MemSingle(null);
    const clean = { ...update };
    delete clean._id; delete clean.__v;
    store[idx] = { ...store[idx], ...clean };
    return new MemSingle(store[idx]);
  },
  async findOneAndDelete(filter: any) {
    const idx = store.findIndex(d => matches(d, filter));
    if (idx === -1) return null;
    const [removed] = store.splice(idx, 1);
    return removed;
  },
};

// ============================================================================
//  Despachador: enruta cada llamada a Mongoose o a memoria según memoryMode.
//  Mantiene la MISMA API (ConsultaModel.find(...), new ConsultaModel(...), etc.)
//  así que NINGÚN otro archivo del proyecto necesita cambios.
// ============================================================================
export const ConsultaModel: any = new Proxy(function () {}, {
  get(_t, prop) {
    const target: any = memoryMode ? MemoryConsulta : MongooseConsulta;
    const val = target[prop];
    return typeof val === 'function' ? val.bind(target) : val;
  },
  construct(_t, args) {
    return memoryMode ? new MemDoc(args[0]) : new (MongooseConsulta as any)(args[0]);
  },
});
