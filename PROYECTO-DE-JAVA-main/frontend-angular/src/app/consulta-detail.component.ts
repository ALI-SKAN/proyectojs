// Componente de detalle: muestra la consulta seleccionada
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultaEstudiante } from './consulta.model';

@Component({
  selector: 'app-consulta-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card detail-card" *ngIf="consulta">
      <div class="detail-header">
        <h3>Detalle #{{ consulta.id }}</h3>
        <span [ngClass]="'badge badge-' + consulta.estado.replace(' ', '-')">{{ consulta.estado }}</span>
      </div>
      <dl class="detail-list">
        <div><dt>Estudiante</dt><dd>{{ consulta.estudiante }}</dd></div>
        <div><dt>DNI</dt><dd>{{ consulta.dni || 'No especificado' }}</dd></div>
        <div><dt>Teléfono</dt><dd>{{ consulta.telefono || 'No especificado' }}</dd></div>
        <div><dt>Correo</dt><dd>{{ consulta.correo || 'No especificado' }}</dd></div>
        <div><dt>Asunto</dt><dd>{{ consulta.asunto }}</dd></div>
        <div><dt>Mensaje</dt><dd>{{ consulta.mensaje }}</dd></div>
        <div><dt>Fecha</dt><dd>{{ consulta.fecha | date: 'medium' }}</dd></div>
        <div *ngIf="consulta.slaLimite"><dt>Plazo SLA</dt><dd style="color: #ef4444; font-weight: bold;">🕒 {{ consulta.slaLimite | date: 'medium' }}</dd></div>
      </dl>
      <div *ngIf="consulta.resumenIA" style="margin: 1rem 0; padding: 10px 14px; background: rgba(139, 92, 246, 0.08); border-left: 4px solid var(--primary); border-radius: 8px; font-size: 0.9rem;">
        <strong>💡 Resumen IA:</strong> {{ consulta.resumenIA }}
      </div>
      <div *ngIf="consulta.adjuntoBase64" style="margin-top: 10px; padding: 12px; background: rgba(255, 255, 255, 0.6); border-radius: 8px; border: 1px solid var(--border);">
        <strong>📎 Adjunto:</strong>
        <div style="margin-top: 5px;">
          <ng-container *ngIf="consulta.adjuntoBase64.startsWith('data:image/'); else pdfTpl">
            <img [src]="consulta.adjuntoBase64" [alt]="consulta.adjuntoNombre" style="max-width: 100%; max-height: 150px; border-radius: 6px; border: 1px solid #cbd5e1; cursor: pointer;" />
          </ng-container>
          <ng-template #pdfTpl>
            <a [href]="consulta.adjuntoBase64" [download]="consulta.adjuntoNombre" class="btn btn-ghost" style="padding: 6px 12px; font-size: 0.85rem; border: 1px solid var(--border); border-radius: 6px; text-decoration: none; color: var(--text-main); display: inline-block;">📄 Descargar {{ consulta.adjuntoNombre }}</a>
          </ng-template>
        </div>
      </div>
      
      <!-- mapa de ruta del tramite -->
      <div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin: 1.5rem 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 0.95rem; color: var(--primary); font-weight: bold;">🗺️ Mapa de Ruta del Trámite (Fases del Documento):</h4>
        <div style="position: relative; width: 100%; overflow-x: auto; display: flex; justify-content: center;">
          <svg width="580" height="240" style="background: rgba(0,0,0,0.02); border-radius: 12px; border: 1px solid var(--border)">
            <defs>
              <linearGradient id="activeGradAng" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="var(--primary)"></stop>
                <stop offset="100%" stop-color="var(--secondary)"></stop>
              </linearGradient>
            </defs>

            <!-- Line 1: Mesa Entrada -> Clasificado (Siempre completa) -->
            <line x1="80" y1="80" x2="220" y2="160" stroke="url(#activeGradAng)" stroke-width="4"></line>
            
            <!-- Line 2: Clasificado -> En Proceso -->
            <line x1="220" y1="160" x2="360" y2="80" stroke-width="4"
                  [attr.stroke]="consulta.estado === 'en proceso' || consulta.estado === 'resuelta' ? 'url(#activeGradAng)' : '#94a3b8'"
                  [attr.stroke-dasharray]="consulta.estado === 'en proceso' || consulta.estado === 'resuelta' ? '0' : '6,6'"></line>
            
            <!-- Line 3: En Proceso -> Resuelto -->
            <line x1="360" y1="80" x2="500" y2="160" stroke-width="4"
                  [attr.stroke]="consulta.estado === 'resuelta' ? 'url(#activeGradAng)' : '#94a3b8'"
                  [attr.stroke-dasharray]="consulta.estado === 'resuelta' ? '0' : '6,6'"></line>

            <!-- Node 1: Mesa de Entrada -->
            <g>
              <circle cx="80" cy="80" r="18" fill="rgba(99, 102, 241, 0.2)"></circle>
              <circle cx="80" cy="80" r="14" fill="url(#activeGradAng)" stroke="#cbd5e1" stroke-width="2"></circle>
              <text x="80" y="84" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">✓</text>
              <text x="80" y="55" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="bold">Recibido</text>
              <text x="80" y="68" text-anchor="middle" fill="var(--text-muted)" font-size="9">Mesa de Entrada</text>
            </g>

            <!-- Node 2: Área de Clasificación -->
            <g>
              <circle cx="220" cy="160" r="18" fill="rgba(99, 102, 241, 0.2)"></circle>
              <circle cx="220" cy="160" r="14" fill="url(#activeGradAng)" stroke="#cbd5e1" stroke-width="2"></circle>
              <text x="220" y="164" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">✓</text>
              <text x="220" y="195" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="bold">Clasificado ({{ consulta.categoria | titlecase }})</text>
              <text x="220" y="208" text-anchor="middle" fill="var(--text-muted)" font-size="9">Área de Clasificación</text>
            </g>

            <!-- Node 3: Módulo de Resolución -->
            <g>
              <circle *ngIf="consulta.estado === 'en proceso' || consulta.estado === 'resuelta'" cx="360" cy="80" r="18" fill="rgba(99, 102, 241, 0.2)"></circle>
              <circle cx="360" cy="80" r="14" 
                      [attr.fill]="consulta.estado === 'en proceso' || consulta.estado === 'resuelta' ? 'url(#activeGradAng)' : '#f1f5f9'" 
                      [attr.stroke]="consulta.estado === 'en proceso' ? 'var(--primary-hover)' : '#cbd5e1'" 
                      [attr.stroke-width]="consulta.estado === 'en proceso' ? '4' : '2'"></circle>
              <text x="360" y="84" text-anchor="middle" 
                    [attr.fill]="consulta.estado === 'en proceso' || consulta.estado === 'resuelta' ? '#fff' : '#475569'" 
                    font-size="11" font-weight="bold">
                <tspan *ngIf="consulta.estado === 'en proceso' || consulta.estado === 'resuelta'">✓</tspan>
                <tspan *ngIf="consulta.estado !== 'en proceso' && consulta.estado !== 'resuelta'">3</tspan>
              </text>
              <text x="360" y="55" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="bold">En Proceso</text>
              <text x="360" y="68" text-anchor="middle" fill="var(--text-muted)" font-size="9">Módulo de Resolución</text>
            </g>

            <!-- Node 4: Oficina de Cierre -->
            <g>
              <circle *ngIf="consulta.estado === 'resuelta'" cx="500" cy="160" r="18" fill="rgba(99, 102, 241, 0.2)"></circle>
              <circle cx="500" cy="160" r="14" 
                      [attr.fill]="consulta.estado === 'resuelta' ? 'url(#activeGradAng)' : '#f1f5f9'" 
                      [attr.stroke]="consulta.estado === 'resuelta' ? 'var(--primary-hover)' : '#cbd5e1'" 
                      [attr.stroke-width]="consulta.estado === 'resuelta' ? '4' : '2'"></circle>
              <text x="500" y="164" text-anchor="middle" 
                    [attr.fill]="consulta.estado === 'resuelta' ? '#fff' : '#475569'" 
                    font-size="11" font-weight="bold">
                <tspan *ngIf="consulta.estado === 'resuelta'">✓</tspan>
                <tspan *ngIf="consulta.estado !== 'resuelta'">4</tspan>
              </text>
              <text x="500" y="195" text-anchor="middle" fill="var(--text-main)" font-size="11" font-weight="bold">Resuelto</text>
              <text x="500" y="208" text-anchor="middle" fill="var(--text-muted)" font-size="9">Oficina de Cierre</text>
            </g>
          </svg>
        </div>
      </div>

      <!-- timeline de auditoria -->
      <div *ngIf="consulta.historial && consulta.historial.length > 0" style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 16px; padding: 20px; margin: 1.5rem 0;">
        <h4 style="margin: 0 0 15px 0; font-size: 0.95rem; color: var(--primary); font-weight: bold;">📅 Historial de Avances y Auditoría:</h4>
        <div style="display: flex; flex-direction: column; gap: 15px; padding-left: 10px; border-left: 2px solid var(--divider-color);">
          <div *ngFor="let h of consulta.historial" style="position: relative;">
            <!-- Dot -->
            <div style="position: absolute; left: -17px; top: 4px; width: 10px; height: 10px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); border: 2px solid var(--card-bg);"></div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <span style="font-size: 0.85rem; font-weight: 800; color: var(--text-main);">{{ h.accion }}</span>
              <span style="font-size: 0.7rem; color: var(--text-muted);">{{ h.fecha | date: 'medium' }}</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 0.8rem; color: var(--text-muted);">{{ h.descripcion }}</p>
          </div>
        </div>
      </div>

      <!-- Botón para editar la consulta seleccionada directamente -->
      <div style="margin-top: 20px; border-top: 1px solid var(--border); padding-top: 15px; display: flex; justify-content: flex-end;">
        <button class="btn btn-primary" (click)="onEdit.emit(consulta)" style="padding: 8px 18px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
          ✏️ Editar Consulta
        </button>
      </div>
    </div>
  `
})
export class ConsultaDetailComponent {
  @Input() consulta: ConsultaEstudiante | null = null;
  @Output() onEdit = new EventEmitter<ConsultaEstudiante>();
}
