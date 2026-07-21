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

export const ConsultaModel = mongoose.model<IConsulta>('Consulta', ConsultaSchema);
