import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultaListComponent } from './consulta-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ConsultaListComponent],
  template: `
    <!-- Barra de navegacion comun con links siempre visibles para facil navegacion -->
    <nav class="topnav" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <span class="brand">🎓 Portal Estudiantil</span>
      <div class="links">
        <a href="/registrar">Registrar</a>
        <a href="/editar" class="active">Editar</a>
        <a href="/filtrar">Filtrar</a>
        <a href="/estado">Estado</a>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button
          type="button"
          (click)="toggleTheme()"
          class="btn btn-ghost"
          style="padding: 6px 14px; font-size: 0.85rem; color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; background: transparent;"
        >
          {{ isDark ? '☀️ Claro' : '🌙 Oscuro' }}
        </button>
        <button 
          *ngIf="hasToken"
          (click)="logout()" 
          class="btn btn-ghost" 
          style="padding: 6px 14px; font-size: 0.85rem; color: #f8fafc; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; background-color: var(--primary);"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </nav>

    <!-- Funcion Editar/Actualizar siempre visible -->
    <app-consulta-list></app-consulta-list>
  `
})
export class AppComponent implements OnInit {
  isDark = false;
  hasToken = false;

  ngOnInit(): void {
    this.isDark = localStorage.getItem('theme') === 'dark';
    this.hasToken = !!localStorage.getItem('token');
    this.applyTheme();

    window.addEventListener('storage', (e) => {
      if (e.key === 'theme') {
        this.isDark = e.newValue === 'dark';
        this.applyTheme();
      }
      if (e.key === 'token') {
        this.hasToken = !!e.newValue;
        if (!e.newValue) {
          window.location.href = '/registrar';
        }
      }
    });
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }

  logout(): void {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      this.hasToken = false;
      window.location.href = '/registrar';
    });
  }
}
