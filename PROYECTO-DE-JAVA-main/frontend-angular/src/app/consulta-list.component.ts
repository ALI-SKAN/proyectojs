// Funcion EDITAR: lista las consultas y permite actualizar la elegida (PUT)
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsultaEstudiante, EstadoConsulta, PrioridadConsulta, CategoriaConsulta } from './consulta.model';
import { ConsultaDetailComponent } from './consulta-detail.component';
import { AppStateSingleton } from './patterns/app-state.singleton';
import { ConsultaAdapter } from './patterns/consulta.adapter';
import { ConsultaFacade } from './patterns/consulta.facade';
import { BadgeFactory } from './patterns/badge.factory';

@Component({
  selector: 'app-consulta-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ConsultaDetailComponent],
  styles: [`
    .notification-banner { background: var(--primary); color: white; margin-bottom: 15px; padding: 10px 20px; text-align: center; border-radius: 8px; font-weight: bold; }
    .cola-section { margin-bottom: 25px; background: rgba(139, 92, 246, 0.05); border: 1px solid var(--primary); }
    .cola-title { margin-top:0; font-size: 1.1rem; color: var(--primary); font-weight: 800; margin-bottom: 12px; }
    .cola-container { display:flex; justify-content: space-between; align-items:center; flex-wrap:wrap; gap:15px; }
    .cola-badges { display:flex; gap:10px; flex-wrap:wrap; align-items: center; }
    .cola-empty-text { color: var(--text-muted); font-size:0.9rem; }
    .cola-badge { color: white; padding: 6px 12px; border-radius: 8px; font-size: 0.85rem; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
    .cola-more-text { color: var(--text-muted); font-size:0.85rem; font-weight: 600; }
    .cola-actions { display:flex; gap:10px; }
    .btn-cola { padding: 8px 16px; font-size: 0.85rem; cursor: pointer; }
    .btn-deshacer { padding: 8px 16px; font-size: 0.85rem; border: 1px solid var(--primary); color: var(--primary); cursor: pointer; background: transparent; }
    
    .view-controls { display: flex; gap: 10px; align-items: center; margin-bottom: 25px; }
    .btn-kanban { display: flex; align-items: center; gap: 6px; }
    .btn-import { display: flex; align-items: center; gap: 6px; border: 1px solid var(--border); color: var(--text-main); }
    
    .kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; width: 100%; }
    .kanban-col { padding: 15px; border-radius: 16px; border: 1px dashed var(--border); transition: all 0.2s ease; min-height: 350px; background: rgba(255,255,255,0.4); }
    .kanban-col.drag-active { background: rgba(139, 92, 246, 0.12); }
    .kanban-col-title { text-align: center; margin-bottom: 15px; font-size:1.1rem; font-weight:700; }
    .kanban-col-title.pendiente { color: #ff9100; }
    .kanban-col-title.en-proceso { color: #00b0ff; }
    .kanban-col-title.resuelta { color: #00e676; }
    .kanban-cards-container { display: flex; flex-direction: column; gap: 12px; min-height: 250px; }
    
    .card-draggable { margin-bottom: 0; padding: 18px; cursor: grab; }
    .card-student-name { font-size: 0.95rem; display:block; }
    .card-dni { font-size: 0.8em; color: var(--text-muted); font-weight: normal; margin-left: 5px; }
    .card-asunto { font-size: 0.8rem; color: var(--text-muted); margin: 4px 0 10px; }
    .card-actions-row { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .card-btn-sm { padding: 4px 10px; font-size: 11px; cursor:pointer; }
    .card-btn-edit { border: 1px solid var(--border); color: var(--text-main); }
  `],
  template: `
    <!-- Cabecera -->
    <header class="hero">
      <h1>✏️ Editar Consultas</h1>
      <p>Selecciona una consulta y actualiza sus datos</p>
    </header>

    <main class="container">
      <!-- Mensaje de notificación del Singleton -->
      <div *ngIf="appState.getNotification()" class="card notification-banner">
        {{ appState.getNotification() }}
      </div>
      
      <!-- WIDGET DE COLA DE PRIORIDADES Y DESHACER (ESTRUCTURAS DE DATOS) -->
      <section class="card cola-section">
        <h3 class="cola-title">🚀 Cola de Atención Inteligente</h3>
        <div class="cola-container">
          <div class="cola-badges">
            <span *ngIf="pendientesCola.length === 0" class="cola-empty-text">No hay tickets pendientes en la cola.</span>
            <span *ngFor="let item of pendientesCola.slice(0, 3); let idx = index" 
                  [style.background]="BadgeFactory.getUrgenciaBadgeColor(item.datos.urgencia)"
                  class="cola-badge">
              #{{idx + 1}} {{item.datos.estudiante}}
            </span>
            <span *ngIf="pendientesCola.length > 3" class="cola-more-text">+{{pendientesCola.length - 3}} más...</span>
          </div>
          <div class="cola-actions">
            <button class="btn btn-primary btn-cola" (click)="atenderSiguiente()" [disabled]="pendientesCola.length === 0">⚙️ Atender Siguiente</button>
            <button class="btn btn-outline btn-deshacer" (click)="deshacer()">🔄 Deshacer</button>
          </div>
        </div>
      </section>

      <!-- Formulario de edicion (solo visible al editar) -->
      <section class="card" *ngIf="editando">
        <h2 class="card-title">✏️ Editar consulta #{{ idEditando }}</h2>
        <div class="form-grid">
          <div class="field"><label>Estudiante</label><input placeholder="Nombre" [(ngModel)]="form.estudiante" /></div>
          <div class="field"><label>DNI</label><input placeholder="DNI" [(ngModel)]="form.dni" /></div>
          <div class="field"><label>Teléfono</label><input placeholder="Teléfono" [(ngModel)]="form.telefono" /></div>
          <div class="field"><label>Correo</label><input placeholder="Correo" [(ngModel)]="form.correo" /></div>
          <div class="field"><label>Asunto</label><input placeholder="Asunto" [(ngModel)]="form.asunto" /></div>
          <div class="field">
            <label>Categoría</label>
            <select [(ngModel)]="form.categoria">
              <option value="academica">Académico</option><option value="administrativa">Administrativo</option>
              <option value="tecnica">Técnico</option><option value="general">General</option>
            </select>
          </div>
          <div class="field">
            <label>Prioridad</label>
            <select [(ngModel)]="form.prioridad">
              <option value="Baja">Baja</option><option value="Media">Media</option><option value="Alta">Alta</option>
            </select>
          </div>
          <div class="field field-full"><label>Mensaje</label><textarea placeholder="Describe..." [(ngModel)]="form.mensaje"></textarea></div>
          <div class="field">
            <label>Estado</label>
            <select [(ngModel)]="form.estado">
              <option value="pendiente">Pendiente</option><option value="en proceso">En proceso</option><option value="resuelta">Resuelta</option>
            </select>
          </div>
          <div class="field field-full"><label>Nota de Agente</label><input placeholder="Nota interna..." [(ngModel)]="form.notaAgente" /></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" (click)="guardar()">Actualizar</button>
          <button class="btn btn-ghost" (click)="cancelar()">Cancelar</button>
        </div>
      </section>

      <!-- Controles de Vista -->
      <div class="view-controls">
        <button class="btn btn-outline btn-kanban" (click)="vistaKanban = !vistaKanban">{{ vistaKanban ? '📋 Lista' : '🗂️ Kanban' }}</button>
        <button class="btn btn-ghost btn-import" (click)="activarImportador()">📥 Importar CSV</button>
        <input type="file" #csvInput accept=".csv" (change)="importarCSV($event)" style="display: none;" />
        <button class="btn btn-ghost btn-import" (click)="imprimirReporte()">🖨️ Imprimir Reporte</button>
      </div>

      <!-- Encabezado del listado -->
      <div class="list-header"><h2>Listado</h2><span class="count">{{ consultas.length }} consulta(s)</span></div>

      <!-- Rejilla de consultas (Lista estándar) -->
      <div class="grid" *ngIf="!vistaKanban && consultas.length > 0; else kanbanVacio">
        <article class="card consulta-card" *ngFor="let c of consultas" (click)="ver(c)" style="cursor: pointer;">
          <div class="consulta-top">
            <span class="avatar" [ngStyle]="{'background': 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', 'color': 'white'}">{{ c.estudiante.charAt(0).toUpperCase() }}</span>
            <div class="consulta-info">
              <strong>{{ c.estudiante }} <span class="card-dni">{{ c.dni ? 'DNI: '+c.dni : '' }}</span></strong>
              <div class="asunto">{{ c.categoria || 'general' }} • {{ c.asunto }}</div>
            </div>
          </div>
          <p class="mensaje">{{ c.mensaje }}</p>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
            <div>Creado: {{ formatearFecha(c.fecha) }}</div>
            <div *ngIf="c.fechaActualizacion && c.fecha !== c.fechaActualizacion">Actualizado: {{ formatearFecha(c.fechaActualizacion) }}</div>
          </div>
          <div class="consulta-actions">
            <span [ngClass]="BadgeFactory.getBadgeClass(c.estado)">{{ c.estado }}</span>
            <span [ngClass]="BadgeFactory.getBadgeClass(c.prioridad || 'Media')">Prioridad: {{ c.prioridad || 'Media' }}</span>
            <div style="flex: 1"></div>
            <button class="btn btn-sm btn-outline" (click)="$event.stopPropagation(); editar(c)">Editar</button>
          </div>
        </article>
      </div>

      <!-- Vista Kanban o Estado Vacío -->
      <ng-template #kanbanVacio>
        <div class="kanban-board" *ngIf="vistaKanban && consultas.length > 0">
          
          <!-- Columna Pendientes -->
          <div class="kanban-col" [class.drag-active]="activeDragCol === 'pendiente'"
               (dragover)="onDragOver($event, 'pendiente')" (dragleave)="onDragLeave()" (drop)="onDrop('pendiente')">
            <h3 class="kanban-col-title pendiente">🟡 Pendientes ({{ pendientes.length }})</h3>
            <div class="kanban-cards-container">
              <div class="card consulta-card card-draggable" *ngFor="let c of pendientes" [draggable]="true" (dragstart)="onDragStart(c)" (click)="ver(c)">
                <strong class="card-student-name">{{ c.estudiante }} <span class="card-dni">{{ c.dni || '' }}</span></strong>
                <div class="card-asunto">{{ c.asunto }}</div>
                <div class="card-actions-row">
                  <button class="btn btn-sm btn-outline card-btn-sm" (click)="$event.stopPropagation(); cambiarEstado(c, 'en proceso')">👉 En Proceso</button>
                  <button class="btn btn-sm btn-ghost card-btn-sm card-btn-edit" (click)="$event.stopPropagation(); editar(c)">✏️ Editar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna En Proceso -->
          <div class="kanban-col" [class.drag-active]="activeDragCol === 'en proceso'"
               (dragover)="onDragOver($event, 'en proceso')" (dragleave)="onDragLeave()" (drop)="onDrop('en proceso')">
            <h3 class="kanban-col-title en-proceso">🔵 En Proceso ({{ enProceso.length }})</h3>
            <div class="kanban-cards-container">
              <div class="card consulta-card card-draggable" *ngFor="let c of enProceso" [draggable]="true" (dragstart)="onDragStart(c)" (click)="ver(c)">
                <strong class="card-student-name">{{ c.estudiante }} <span class="card-dni">{{ c.dni || '' }}</span></strong>
                <div class="card-asunto">{{ c.asunto }}</div>
                <div class="card-actions-row">
                  <div style="display: flex; gap: 4px;">
                    <button class="btn btn-sm btn-ghost card-btn-sm" (click)="$event.stopPropagation(); cambiarEstado(c, 'pendiente')">👈</button>
                    <button class="btn btn-sm btn-outline card-btn-sm" (click)="$event.stopPropagation(); cambiarEstado(c, 'resuelta')">👉 Resolver</button>
                  </div>
                  <button class="btn btn-sm btn-ghost card-btn-sm card-btn-edit" (click)="$event.stopPropagation(); editar(c)">✏️</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Columna Resueltas -->
          <div class="kanban-col" [class.drag-active]="activeDragCol === 'resuelta'"
               (dragover)="onDragOver($event, 'resuelta')" (dragleave)="onDragLeave()" (drop)="onDrop('resuelta')">
            <h3 class="kanban-col-title resuelta">🟢 Resueltas ({{ resueltas.length }})</h3>
            <div class="kanban-cards-container">
              <div class="card consulta-card card-draggable" *ngFor="let c of resueltas" [draggable]="true" (dragstart)="onDragStart(c)" (click)="ver(c)">
                <strong class="card-student-name">{{ c.estudiante }} <span class="card-dni">{{ c.dni || '' }}</span></strong>
                <div class="card-asunto">{{ c.asunto }}</div>
                <div class="card-actions-row">
                  <button class="btn btn-sm btn-ghost card-btn-sm" (click)="$event.stopPropagation(); cambiarEstado(c, 'en proceso')">👈 En Proceso</button>
                  <button class="btn btn-sm btn-ghost card-btn-sm card-btn-edit" (click)="$event.stopPropagation(); editar(c)">✏️ Editar</button>
                </div>
              </div>
            </div>
          </div>

        </div>
        <div class="empty" *ngIf="consultas.length === 0">
          <span class="empty-icon">📭</span>
          <p>No hay consultas registradas todavía.</p>
        </div>
      </ng-template>

      <!-- Detalle de la consulta seleccionada -->
      <app-consulta-detail [consulta]="seleccionada" (onEdit)="editar($event)"></app-consulta-detail>
    </main>
  `
})
export class ConsultaListComponent implements OnInit, OnDestroy {
  @ViewChild('csvInput') csvInput!: ElementRef<HTMLInputElement>;
  
  BadgeFactory = BadgeFactory;

  consultas: ConsultaAdapter[] = [];
  seleccionada: ConsultaEstudiante | null = null;
  editando = false;
  idEditando: number | null = null;
  vistaKanban = true;
  pendientesCola: any[] = [];
  private sseStream: EventSource | null = null;

  draggedConsulta: ConsultaEstudiante | null = null;
  activeDragCol: string | null = null;

  form: Partial<ConsultaEstudiante> = { 
    estado: 'pendiente' as EstadoConsulta, 
    prioridad: 'Media' as PrioridadConsulta, 
    categoria: 'Académico' as CategoriaConsulta,
    telefono: '', correo: '', dni: ''
  };

  constructor(public facade: ConsultaFacade, public appState: AppStateSingleton) {}

  ngOnInit(): void {
    this.cargar();
    this.conectarSSE();
  }

  ngOnDestroy(): void {
    if (this.sseStream) this.sseStream.close();
  }

  conectarSSE(): void {
    this.sseStream = new EventSource('/api/consultas/stream');
    const updateHandler = () => this.cargar();
    this.sseStream.addEventListener('create', updateHandler);
    this.sseStream.addEventListener('update', updateHandler);
    this.sseStream.addEventListener('delete', updateHandler);
  }

  cargar(): void {
    this.facade.listarConsultas().subscribe(data => (this.consultas = data));
    this.facade.obtenerPendientesCola().subscribe(data => (this.pendientesCola = data));
  }

  formatearFecha(d: string | undefined): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  deshacer(): void {
    this.facade.deshacerUltimoCambio().subscribe({
      next: () => this.cargar(),
      error: (err) => alert(err.error?.error || 'No hay modificaciones registradas para deshacer.')
    });
  }

  atenderSiguiente(): void {
    this.facade.atenderSiguienteTicket().subscribe({
      next: (ticket) => {
        alert(`Atendiendo ticket prioritario de ${ticket.estudiante}: "${ticket.asunto}"`);
        this.cargar();
      },
      error: (err) => alert(err.error?.error || 'Error al atender ticket')
    });
  }

  editar(c: ConsultaEstudiante): void {
    this.editando = true;
    this.idEditando = c.id;
    this.form = { ...c, notaAgente: '' };
    this.seleccionada = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  guardar(): void {
    if (this.idEditando == null) return;
    this.facade.actualizarConsulta(this.idEditando, this.form).subscribe(() => {
      this.cancelar();
      this.cargar();
    });
  }

  cancelar(): void {
    this.editando = false;
    this.idEditando = null;
    this.form = { estado: 'pendiente', prioridad: 'Media', categoria: 'Académico', telefono: '', correo: '', dni: '', notaAgente: '' };
  }

  ver(c: ConsultaEstudiante): void {
    this.seleccionada = c;
  }

  onDragStart(c: ConsultaEstudiante): void { this.draggedConsulta = c; }
  onDragOver(event: DragEvent, col: string): void { event.preventDefault(); this.activeDragCol = col; }
  onDragLeave(): void { this.activeDragCol = null; }
  onDrop(nuevoEstado: EstadoConsulta): void {
    this.activeDragCol = null;
    if (!this.draggedConsulta || this.draggedConsulta.estado === nuevoEstado) {
      this.draggedConsulta = null;
      return;
    }
    this.cambiarEstado(this.draggedConsulta, nuevoEstado);
    this.draggedConsulta = null;
  }

  cambiarEstado(c: ConsultaEstudiante, nuevoEstado: string): void {
    this.facade.actualizarEstado(c.id, nuevoEstado).subscribe(() => this.cargar());
  }

  activarImportador(): void {
    if (this.csvInput) {
      this.csvInput.nativeElement.click();
    }
  }

  imprimirReporte(): void {
    window.print();
  }

  importarCSV(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const text = e.target.result;
      const lines = text.split('\n');
      let importCount = 0;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const cols = line.split(',');
        if (cols.length < 5) continue;

        const nueva: Partial<ConsultaEstudiante> = {
          estudiante: cols[1]?.replace(/^"|"$/g, '') || 'Estudiante Importado',
          telefono: cols[2]?.replace(/^"|"$/g, '') || '',
          correo: cols[3]?.replace(/^"|"$/g, '') || '',
          asunto: cols[4]?.replace(/^"|"$/g, '') || 'Importado por CSV',
          mensaje: cols[5]?.replace(/^"|"$/g, '') || 'Descripción del caso',
          categoria: 'general',
          prioridad: 'Media',
          estado: 'pendiente'
        };

        this.facade.importarConsultaCSV(nueva).subscribe(() => {
          importCount++;
          if (importCount === lines.length - 2) this.cargar();
        });
      }
    };
    reader.readAsText(file);
  }

  get pendientes(): ConsultaAdapter[] { return this.consultas.filter(c => c.estado === 'pendiente'); }
  get enProceso(): ConsultaAdapter[] { return this.consultas.filter(c => c.estado === 'en proceso'); }
  get resueltas(): ConsultaAdapter[] { return this.consultas.filter(c => c.estado === 'resuelta'); }
}
