import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConsultaEstudiante } from './consulta.model';
import { ConsultaAdapter } from './patterns/consulta.adapter';

@Injectable({ providedIn: 'root' })
export class ConsultaService {
  // Base de la API REST (mismo origen/puerto que el servidor unificado)
  private api = '/api/consultas';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token') || '';
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  }

  // Listar todas las consultas
  listar(): Observable<ConsultaAdapter[]> {
    return this.http.get<ConsultaEstudiante[]>(this.api).pipe(
      map(consultas => consultas.map(c => ConsultaAdapter.fromDTO(c)))
    );
  }

  // Actualizar una consulta existente (función de esta app: editar)
  actualizar(id: number, datos: Partial<ConsultaEstudiante>): Observable<ConsultaEstudiante> {
    return this.http.put<ConsultaEstudiante>(`${this.api}/${id}`, datos, this.getHeaders());
  }

  // Crear una nueva consulta (usado para importar)
  crear(datos: Partial<ConsultaEstudiante>): Observable<ConsultaEstudiante> {
    return this.http.post<ConsultaEstudiante>(this.api, datos, this.getHeaders());
  }

  // 1. Deshacer el último cambio realizado (Pila)
  deshacer(): Observable<ConsultaEstudiante> {
    return this.http.post<ConsultaEstudiante>(`${this.api}/deshacer`, {}, this.getHeaders());
  }

  // 2. Obtener lista de cola ordenada de pendientes (ColaPrioridad)
  obtenerPendientesCola(): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/cola/pendientes`);
  }

  // 3. Atender al siguiente ticket prioritario en la cola (ColaPrioridad)
  atenderSiguiente(): Observable<ConsultaEstudiante> {
    return this.http.post<ConsultaEstudiante>(`${this.api}/cola/atender`, {}, this.getHeaders());
  }
}
