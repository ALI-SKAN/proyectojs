import { ConsultaEstudiante } from '../consulta.model';

// Adapter Pattern: Adapta la interfaz que viene del servidor a una clase rica con métodos útiles
export class ConsultaAdapter implements ConsultaEstudiante {
  constructor(
    public id: number,
    public estudiante: string,
    public asunto: string,
    public mensaje: string,
    public estado: any,
    public prioridad: any,
    public categoria: any,
    public fecha: string,
    public telefono?: string,
    public correo?: string,
    public notaAgente?: string,
    public fechaActualizacion?: string,
    public resumenIA?: string,
    public adjuntoBase64?: string,
    public adjuntoNombre?: string,
    public slaLimite?: string,
    public historial?: any[],
    public dni?: string
  ) {}

  get estadoFormateado(): string {
    return this.estado.toUpperCase();
  }

  get esUrgente(): boolean {
    return this.prioridad === 'Alta' || this.prioridad === 'urgente' || this.prioridad === 'inmediata';
  }

  static fromDTO(dto: ConsultaEstudiante): ConsultaAdapter {
    return new ConsultaAdapter(
      dto.id,
      dto.estudiante,
      dto.asunto,
      dto.mensaje,
      dto.estado,
      dto.prioridad || 'Media',
      dto.categoria || 'general',
      dto.fecha,
      dto.telefono,
      dto.correo,
      dto.notaAgente,
      dto.fechaActualizacion,
      dto.resumenIA,
      dto.adjuntoBase64,
      dto.adjuntoNombre,
      dto.slaLimite,
      dto.historial,
      dto.dni
    );
  }
}
