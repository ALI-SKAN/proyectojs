// Modelo de datos compartido por toda la API
export type EstadoConsulta = 'pendiente' | 'en proceso' | 'resuelta';
export type PrioridadConsulta = 'Baja' | 'Media' | 'Alta';
export type CategoriaConsulta = 'Académico' | 'Administrativo' | 'Técnico';

export interface ConsultaEstudiante {
  id: string;
  estudiante: string;
  titulo: string;
  descripcion: string;
  categoria: 'academica' | 'administrativa' | 'tecnica' | 'general';
  urgencia: 'inmediata' | 'urgente' | 'normal' | 'baja';
  canal: 'presencial' | 'email' | 'plataforma' | 'telefono';
  fechaCreacion: string;
  fechaActualizacion?: string;
  telefono?: string;
  correo?: string;
  resumenIA?: string;
  adjuntoBase64?: string;
  adjuntoNombre?: string;
  slaLimite?: string;
}

export type ConsultaInput = Omit<ConsultaEstudiante, 'id' | 'fechaCreacion'>;
