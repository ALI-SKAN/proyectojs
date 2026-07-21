import { Injectable } from '@angular/core';
import { ConsultaService } from '../consulta.service';
import { AppStateSingleton } from './app-state.singleton';
import { ConsultaEstudiante } from '../consulta.model';
import { Observable } from 'rxjs';
import { ConsultaAdapter } from './consulta.adapter';

// Facade Pattern: Proporciona una interfaz simplificada para un subsistema complejo (Servicio HTTP + Singleton State)
@Injectable({
  providedIn: 'root'
})
export class ConsultaFacade {
  constructor(
    private consultaService: ConsultaService,
    private appState: AppStateSingleton
  ) {}

  listarConsultas(): Observable<ConsultaAdapter[]> {
    return this.consultaService.listar();
  }

  obtenerPendientesCola(): Observable<any[]> {
    return this.consultaService.obtenerPendientesCola();
  }

  deshacerUltimoCambio(): Observable<any> {
    return this.consultaService.deshacer();
  }

  atenderSiguienteTicket(): Observable<any> {
    return this.consultaService.atenderSiguiente();
  }

  actualizarEstado(id: number, nuevoEstado: string): Observable<any> {
    const ob = this.consultaService.actualizar(id, { estado: nuevoEstado });
    ob.subscribe({
      next: () => this.appState.setNotification(`Consulta movida a: ${nuevoEstado}`)
    });
    return ob;
  }

  actualizarConsulta(id: number, data: Partial<ConsultaEstudiante>): Observable<any> {
    const ob = this.consultaService.actualizar(id, data);
    ob.subscribe({
      next: () => this.appState.setNotification('¡Consulta actualizada exitosamente!')
    });
    return ob;
  }

  importarConsultaCSV(nueva: Partial<ConsultaEstudiante>): Observable<any> {
    return this.consultaService.crear(nueva);
  }
}
