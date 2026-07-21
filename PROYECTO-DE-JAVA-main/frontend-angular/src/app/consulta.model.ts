// Modelo de datos de una consulta estudiantil

export type EstadoConsulta = 'pendiente' | 'en proceso' | 'resuelta';
export type PrioridadConsulta = 'Baja' | 'Media' | 'Alta';
export type CategoriaConsulta = 'Académico' | 'Administrativo' | 'Técnico';

export interface ConsultaEstudiante {
  id: number;
  estudiante: string;
  dni?: string;
  asunto: string;
  mensaje: string;
  estado: EstadoConsulta | string;
  prioridad: PrioridadConsulta | string;
  categoria: CategoriaConsulta | string;
  fecha: string;
  fechaActualizacion?: string;
  telefono?: string;
  correo?: string;
  resumenIA?: string;
  adjuntoBase64?: string;
  adjuntoNombre?: string;
  slaLimite?: string;
  historial?: any[];
  notaAgente?: string;
}
