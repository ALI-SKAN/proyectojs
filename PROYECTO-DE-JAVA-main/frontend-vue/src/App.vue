<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { globalEventBus } from './patterns/EventBus'
import { apiFacade } from './patterns/apiFacade'
import { UIContext, SuccessState, ErrorState } from './patterns/State'
import { FilterContext, filterStrategies } from './patterns/FilterStrategy'

// API relativa: mismo origen y puerto (servidor unificado 3001)
const API = '/api/consultas'

// Estado reactivo
const consultas = ref([])      // lista completa traída del servidor o BST
const uiState = ref(new UIContext().render())

// Filtros y ordenamiento
const filtro = ref('')
const searchQuery = ref('')
const soloVencidosSLA = ref(false)
const seleccionados = ref([])
const criterioOrden = ref('estudiante') // 'estudiante' o 'id' o 'categoria'
const historialBusquedas = ref(JSON.parse(localStorage.getItem('historial_busquedas') || '[]'))

// Filtros secundarios
const filtroCategoria = ref('')
const filtroUrgencia = ref('')
const filtroCanal = ref('')

// Tema y Autenticación
const isDark = ref(false)
const hasToken = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  applyTheme()
}

const applyTheme = () => {
  if (isDark.value) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}

const logout = () => {
  fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    hasToken.value = false
    window.location.href = '/registrar'
  })
}

// IMPLEMENTACIÓN MANUAL DE ALGORITMO QUICKSORT (Complejidad: O(n log n))
function quickSort(arr, key = 'estudiante') {
  if (arr.length <= 1) return arr;
  const pivot = arr[arr.length - 1];
  const left = [];
  const right = [];
  
  const getVal = (item) => {
    if (key === 'id') return Number(item.id) || 0;
    return (item[key] || '').toString().toLowerCase();
  };

  const pivotVal = getVal(pivot);

  for (let i = 0; i < arr.length - 1; i++) {
    const val = getVal(arr[i]);
    if (val < pivotVal) {
      left.push(arr[i]);
    } else {
      right.push(arr[i]);
    }
  }
  return [...quickSort(left, key), pivot, ...quickSort(right, key)];
}

// Carga las consultas utilizando el endpoint recursivo del BST en el backend
async function cargarConsultas() {
  const ctx = new UIContext();
  uiState.value = ctx.render();
  try {
    let url = API;
    if (filtro.value.trim() !== '') {
      url = `/api/consultas/buscar-bst?q=${encodeURIComponent(filtro.value)}`;
    }
    const data = await apiFacade.get(url);
    consultas.value = data;
    ctx.setState(new SuccessState(ctx, data));
    uiState.value = ctx.render();
  } catch (e) {
    ctx.setState(new ErrorState(ctx, e.message));
    uiState.value = ctx.render();
  }
}

const eliminar = async (id) => {
  if (!confirm('¿Eliminar esta consulta?')) return
  try {
    await apiFacade.delete(`${API}/${id}`)
    globalEventBus.emit('notificacion', 'Consulta eliminada exitosamente');
    cargarConsultas()
  } catch (err) {
    // Manejo de error
  }
}

const toggleSeleccion = (id) => {
  if (seleccionados.value.includes(id)) {
    seleccionados.value = seleccionados.value.filter(x => x !== id)
  } else {
    seleccionados.value.push(id)
  }
}

const eliminarLote = async () => {
  if (seleccionados.value.length === 0) return
  if (!confirm(`¿Eliminar las ${seleccionados.value.length} consultas seleccionadas?`)) return
  
  try {
    for (const id of seleccionados.value) {
      await apiFacade.delete(`${API}/${id}`)
    }
    seleccionados.value = []
    globalEventBus.emit('notificacion', 'Consultas eliminadas en lote');
    cargarConsultas()
  } catch (err) {
    // Manejo de error
  }
}

let sse = null
const notificacionGlobal = ref('')

onMounted(() => {
  globalEventBus.on('notificacion', (msg) => {
    notificacionGlobal.value = msg;
    setTimeout(() => notificacionGlobal.value = '', 3000);
  });

  isDark.value = localStorage.getItem('theme') === 'dark'
  hasToken.value = !!localStorage.getItem('token')
  
  applyTheme()
  cargarConsultas()

  window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
      isDark.value = e.newValue === 'dark'
      applyTheme()
    }
    if (e.key === 'token') {
      hasToken.value = !!e.newValue
      if (!e.newValue) {
        window.location.href = '/registrar'
      }
    }
  })
  
  sse = new EventSource('/api/consultas/stream')
  const handleUpdate = () => cargarConsultas()
  sse.addEventListener('create', handleUpdate)
  sse.addEventListener('update', handleUpdate)
  sse.addEventListener('delete', handleUpdate)
})

onUnmounted(() => {
  if (sse) sse.close()
})

const aplicarFiltro = () => {
  filtro.value = searchQuery.value
  cargarConsultas()
  if (searchQuery.value.trim() && !historialBusquedas.value.includes(searchQuery.value.trim())) {
    historialBusquedas.value = [searchQuery.value.trim(), ...historialBusquedas.value.slice(0, 4)]
    localStorage.setItem('historial_busquedas', JSON.stringify(historialBusquedas.value))
  }
}

const aplicarBusquedaReciente = (query) => {
  searchQuery.value = query
  aplicarFiltro()
}

// Reactividad combinada con QuickSort y Filtros en memoria secundarios
const filtradas = computed(() => {
  const filterCtx = new FilterContext();
  
  filterCtx.addStrategy((list, c) => c ? list.filter(x => x.categoria === c) : list, filtroCategoria.value);
  filterCtx.addStrategy(filterStrategies.prioridad, filtroUrgencia.value);
  filterCtx.addStrategy((list, c) => c ? list.filter(x => x.canal === c) : list, filtroCanal.value);
  filterCtx.addStrategy((list, checked) => {
    if (!checked) return list;
    const ahora = new Date();
    return list.filter(x => x.slaLimite && new Date(x.slaLimite) < ahora);
  }, soloVencidosSLA.value);
  
  let res = filterCtx.execute(consultas.value);
  
  // Ejecutamos QuickSort manual explicito
  res = quickSort(res, criterioOrden.value);
  
  return res;
})

const formatearFecha = (d) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// KPI analytics computation
const kpis = computed(() => {
  const list = consultas.value;
  const pendientes = list.filter(c => c.estado === 'pendiente' || c.estado === 'en proceso').length;
  const ahora = new Date();
  const vencidosSLA = list.filter(c => c.slaLimite && new Date(c.slaLimite) < ahora).length;
  
  const total = list.length || 1;
  const catAcademica = list.filter(c => c.categoria === 'academica').length;
  const catAdmin = list.filter(c => c.categoria === 'administrativa').length;
  const catTecnica = list.filter(c => c.categoria === 'tecnica').length;
  
  return {
    pendientes,
    vencidosSLA,
    porcentajeAcademica: Math.round((catAcademica / total) * 100),
    porcentajeAdmin: Math.round((catAdmin / total) * 100),
    porcentajeTecnica: Math.round((catTecnica / total) * 100),
  };
});

// SVG Donut Chart segment calculations
const donutSegments = computed(() => {
  const list = consultas.value;
  const total = list.length || 1;
  const p = list.filter(c => c.estado === 'pendiente').length;
  const ep = list.filter(c => c.estado === 'en proceso').length;
  const r = list.filter(c => c.estado === 'resuelta' || c.estado === 'atendido').length;
  
  const pctP = p / total;
  const pctEp = ep / total;
  const pctR = r / total;
  
  const circ = 251.2;
  const lenP = pctP * circ;
  const lenEp = pctEp * circ;
  const lenR = pctR * circ;
  
  return {
    pendiente: { strokeDash: `${lenP} ${circ - lenP}`, strokeOffset: 0, pct: Math.round(pctP * 100) },
    enProceso: { strokeDash: `${lenEp} ${circ - lenEp}`, strokeOffset: -lenP, pct: Math.round(pctEp * 100) },
    resuelta: { strokeDash: `${lenR} ${circ - lenR}`, strokeOffset: -(lenP + lenEp), pct: Math.round(pctR * 100) },
    total: list.length
  };
});

// CSV Export logic
const exportarCSV = () => {
  if (filtradas.value.length === 0) return;
  
  // CSV Header
  let csvContent = "\uFEFF"; // BOM for excel utf-8 encoding support
  csvContent += "ID,Estudiante,Telefono,Correo,Asunto,Mensaje,Estado,Prioridad,Categoria,Fecha\n";
  
  filtradas.value.forEach(c => {
    const row = [
      c.id,
      `"${(c.estudiante || '').replace(/"/g, '""')}"`,
      `"${(c.telefono || '').replace(/"/g, '""')}"`,
      `"${(c.correo || '').replace(/"/g, '""')}"`,
      `"${(c.asunto || '').replace(/"/g, '""')}"`,
      `"${(c.mensaje || c.descripcion || '').replace(/"/g, '""')}"`,
      c.estado || 'pendiente',
      c.prioridad || 'Media',
      c.categoria || 'general',
      c.fechaCreacion || c.fecha
    ].join(",");
    csvContent += row + "\n";
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `reporte_consultas_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div>
    <!-- Barra superior unificada sin target _blank para permanecer en la misma pestaña -->
    <nav class="topnav" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div class="brand" style="display: flex; align-items: center; gap: 10px;">
        🎓 Portal Estudiantil
        <span style="display: inline-flex; align-items: center; gap: 5px; fontSize: 0.7rem; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 3px 8px; borderRadius: 10px; fontWeight: bold;">
          <span class="pulse-dot" style="width: 6px; height: 6px; borderRadius: 50%; background: #10b981; display: inline-block;"></span>
          Conectado
        </span>
      </div>
      <div class="links">
        <a href="/registrar">Registrar</a>
        <a href="/editar">Editar</a>
        <a class="active" href="/filtrar">Filtrar</a>
        <a href="/estado">Estado</a>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <button
          type="button"
          @click="toggleTheme"
          class="btn btn-ghost"
          style="padding: 6px 14px; font-size: 0.85rem; color: var(--text-main); border: 1px solid var(--border); border-radius: 8px; cursor: pointer; background: transparent;"
        >
          {{ isDark ? '☀️ Claro' : '🌙 Oscuro' }}
        </button>
        <button 
          v-if="hasToken"
          @click="logout" 
          class="btn btn-ghost" 
          style="padding: 6px 14px; font-size: 0.85rem; color: #f8fafc; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; background-color: var(--primary);"
        >
          🚪 Cerrar Sesión
        </button>
      </div>
    </nav>
    
    <div class="hero">
      <h1>Filtrar Consultas</h1>
      <p>Busca incidencias por estudiante, asunto, categoría o estado.</p>
    </div>

    <div class="container">
      <!-- Notificación global -->
      <div v-if="notificacionGlobal" class="card" style="background: var(--primary); color: white; margin-bottom: 15px; padding: 10px 20px; text-align: center; border-radius: 8px; font-weight: bold;">
        {{ notificacionGlobal }}
      </div>

      <!-- Panel de Métricas / KPIs (Fase 3) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px;">
        <div class="card glass-card" style="margin-bottom: 0; padding: 20px; display: flex; align-items: center; gap: 15px;">
          <span style="font-size: 2rem;">🟡</span>
          <div>
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Tickets Activos</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); line-height: 1.1;">{{ kpis.pendientes }}</div>
          </div>
        </div>
        
        <div class="card glass-card" style="margin-bottom: 0; padding: 20px; display: flex; align-items: center; gap: 15px; border-color: rgba(239, 68, 68, 0.2) !important;">
          <span style="font-size: 2rem;">⚠️</span>
          <div>
            <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Excedidos SLA</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: #ef4444; line-height: 1.1;">{{ kpis.vencidosSLA }}</div>
          </div>
        </div>

        <!-- Donut Chart SVG widget -->
        <div class="card glass-card" style="margin-bottom: 0; padding: 15px; display: flex; align-items: center; justify-content: center; gap: 12px;">
          <svg width="70" height="70" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(0,0,0,0.05)" stroke-width="12"></circle>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" stroke-width="12"
              :stroke-dasharray="donutSegments.pendiente.strokeDash"
              :stroke-dashoffset="donutSegments.pendiente.strokeOffset"
              transform="rotate(-90 50 50)" style="transition: all 0.5s ease;"></circle>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#3b82f6" stroke-width="12"
              :stroke-dasharray="donutSegments.enProceso.strokeDash"
              :stroke-dashoffset="donutSegments.enProceso.strokeOffset"
              transform="rotate(-90 50 50)" style="transition: all 0.5s ease;"></circle>
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#10b981" stroke-width="12"
              :stroke-dasharray="donutSegments.resuelta.strokeDash"
              :stroke-dashoffset="donutSegments.resuelta.strokeOffset"
              transform="rotate(-90 50 50)" style="transition: all 0.5s ease;"></circle>
            <text x="50" y="55" text-anchor="middle" font-size="14" font-weight="bold" fill="var(--text-main)">
              {{ donutSegments.total }}
            </text>
            <text x="50" y="70" text-anchor="middle" font-size="9" fill="var(--text-muted)">
              Total
            </text>
          </svg>
          <div style="font-size: 0.7rem; display: flex; flex-direction: column; gap: 4px;">
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #f59e0b;"></span>
              <span>Pendiente ({{ donutSegments.pendiente.pct }}%)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #3b82f6;"></span>
              <span>Proceso ({{ donutSegments.enProceso.pct }}%)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 4px;">
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #10b981;"></span>
              <span>Resuelta ({{ donutSegments.resuelta.pct }}%)</span>
            </div>
          </div>
        </div>

        <div class="card glass-card" style="margin-bottom: 0; padding: 20px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Distribución por Categorías</div>
          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.75rem; width: 100%;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <span>📚 Académica ({{ kpis.porcentajeAcademica || 0 }}%)</span>
              <div style="flex: 1; height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; overflow: hidden; max-width: 80px;">
                <div :style="{ width: (kpis.porcentajeAcademica || 0) + '%' }" style="height: 100%; background: var(--primary); border-radius: 3px;"></div>
              </div>
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;">
              <span>📋 Admin ({{ kpis.porcentajeAdmin || 0 }}%)</span>
              <div style="flex: 1; height: 6px; background: rgba(0,0,0,0.05); border-radius: 3px; overflow: hidden; max-width: 80px;">
                <div :style="{ width: (kpis.porcentajeAdmin || 0) + '%' }" style="height: 100%; background: var(--secondary); border-radius: 3px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card filtros" style="display: flex; flex-direction: column; gap: 15px; align-items: stretch;">
        
        <div style="display: flex; gap: 15px; flex-wrap: wrap;">
          <div style="flex: 1; min-width: 200px;">
            <label style="font-weight:700; color:var(--text-muted); display: block; margin-bottom: 5px;">🔍 BÚSQUEDA</label>
            <div style="display: flex; gap: 10px;">
              <input 
                v-model="searchQuery" 
                @keyup.enter="aplicarFiltro" 
                placeholder="Buscar por estudiante, título, descripción..." 
              />
              <button class="btn btn-primary" @click="aplicarFiltro">Buscar</button>
              <button class="btn btn-ghost" @click="exportarCSV" style="display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--border); color: var(--text-main); background: transparent; padding: 10px 18px; border-radius: 14px; font-weight: 700; cursor: pointer;">
                📥 Exportar CSV
              </button>
            </div>
            <div v-if="historialBusquedas.length > 0" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 8px; font-size: 0.75rem; color: var(--text-muted);">
              <span>Búsquedas recientes:</span>
              <span v-for="(h, i) in historialBusquedas" :key="i" @click="aplicarBusquedaReciente(h)" style="background: rgba(99, 102, 241, 0.08); padding: 3px 8px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-weight: 600; color: var(--primary);">
                🔍 {{ h }}
              </span>
            </div>
          </div>
          
          <div style="width: 230px;">
            <label style="font-weight:700; color:var(--text-muted); display: block; margin-bottom: 5px;">⚡ ORDEN</label>
            <select v-model="criterioOrden">
              <option value="estudiante">👨‍🎓 Estudiante (A-Z)</option>
              <option value="id">🔢 ID Ticket</option>
              <option value="categoria">📂 Categoría</option>
            </select>
          </div>
        </div>
        
        <!-- Fila de filtros por Categoría, Urgencia y Canal -->
        <div style="display: flex; gap: 15px; flex-wrap: wrap; margin-top: 5px;">
          <div style="flex: 1; min-width: 160px;">
            <label style="font-weight:700; color:var(--text-muted); display: block; margin-bottom: 5px;">📂 CATEGORÍA</label>
            <select v-model="filtroCategoria">
              <option value="">Todas</option>
              <option value="academica">📚 Académica</option>
              <option value="administrativa">📋 Administrativa</option>
              <option value="tecnica">💻 Técnica</option>
              <option value="general">📌 General</option>
            </select>
          </div>
          
          <div style="flex: 1; min-width: 160px;">
            <label style="font-weight:700; color:var(--text-muted); display: block; margin-bottom: 5px;">🚨 URGENCIA</label>
            <select v-model="filtroUrgencia">
              <option value="">Todas</option>
              <option value="inmediata">🔴 Inmediata</option>
              <option value="urgente">🟠 Urgente</option>
              <option value="normal">🟡 Normal</option>
              <option value="baja">🟢 Baja</option>
            </select>
          </div>

          <div style="flex: 1; min-width: 160px;">
            <label style="font-weight:700; color:var(--text-muted); display: block; margin-bottom: 5px;">🔌 CANAL</label>
            <select v-model="filtroCanal">
              <option value="">Todos</option>
              <option value="presencial">🏫 Presencial</option>
              <option value="email">📧 Email</option>
              <option value="plataforma">💻 Plataforma</option>
              <option value="telefono">📞 Teléfono</option>
            </select>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 15px; flex-wrap: wrap; margin-top: 10px;">
          <label style="display: flex; align-items: center; gap: 8px; font-weight: 600; cursor: pointer; color: var(--text-muted);">
            <input type="checkbox" v-model="soloVencidosSLA" style="width: auto; padding: 0; cursor: pointer;" />
            ⚠️ Mostrar solo vencidos por SLA
          </label>
          
          <button 
            v-if="seleccionados.length > 0" 
            class="btn btn-danger" 
            @click="eliminarLote" 
            style="padding: 10px 18px; border-radius: 10px;"
          >
            🗑️ Eliminar seleccionados ({{ seleccionados.length }})
          </button>
        </div>
      </div>

      <p v-if="uiState.isLoading" class="empty">Cargando consultas...</p>
      <p v-if="uiState.error" class="error">{{ uiState.error }}</p>
      <p v-if="consultas.length === 0 && !uiState.error && !uiState.isLoading" class="empty">No hay consultas registradas aún.</p>
      
      <div class="list-header" v-if="consultas.length > 0">
        <h3>Resultados ({{ filtradas.length }})</h3>
      </div>

      <div class="grid">
        <div v-for="c in filtradas" :key="c.id" class="consulta-card">
          <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
            <input 
              type="checkbox" 
              :checked="seleccionados.includes(c.id)" 
              @change="toggleSeleccion(c.id)" 
              style="width: 20px; height: 20px; cursor: pointer; margin-top: 8px;"
            />
            <div style="flex: 1;">
              <div class="consulta-top">
                <div class="avatar" style="background: linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%); color: white;">
                  {{ c.estudiante.charAt(0).toUpperCase() }}
                </div>
                <div class="consulta-info">
                  <strong>{{ c.estudiante }}</strong>
                  <div class="asunto">{{ c.categoria || 'General' }} • {{ c.asunto }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <p class="mensaje">{{ c.mensaje || c.descripcion }}</p>
          
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 10px;">
            <div>Creado: {{ formatearFecha(c.fechaCreacion || c.fecha) }}</div>
            <div v-if="c.fechaActualizacion && (c.fechaCreacion || c.fecha) !== c.fechaActualizacion">Actualizado: {{ formatearFecha(c.fechaActualizacion) }}</div>
            <div v-if="c.slaLimite" style="margin-top: 2px;">
              SLA límite: <span :style="{ color: new Date(c.slaLimite) < new Date() ? '#ef4444' : '#10b981', fontWeight: 'bold' }">{{ new Date(c.slaLimite).toLocaleString() }}</span>
            </div>
          </div>
          
          <div class="consulta-actions">
            <span :class="['badge', 'badge-' + (c.estado || 'pendiente').replace(' ', '-')]">{{ c.estado || 'pendiente' }}</span>
            <span :class="['badge', 'badge-' + (c.prioridad || 'Media')]">Prioridad: {{ c.prioridad || 'Media' }}</span>
            <button @click="eliminar(c.id)" class="btn btn-danger btn-sm" style="margin-left: auto; padding: 4px 10px; font-size:12px;">Eliminar</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* ===== Diseño Ultra Vibrante y Luminoso ===== */
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap');

:root {
  --primary: #6366f1;       /* Indigo 500 */
  --primary-hover: #4f46e5;
  --secondary: #ec4899;     /* Pink 500 */
  --bg-gradient: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
  --card-bg: rgba(255, 255, 255, 0.85);
  --card-border: rgba(255, 255, 255, 0.6);
  --text-main: #0f172a;
  --text-muted: #475569;
  --border: rgba(99, 102, 241, 0.2);
  
  /* Input variables */
  --input-bg: rgba(255, 255, 255, 0.95);
  --input-border: #e2e8f0;
  --input-color: #0f172a;
  --input-focus-bg: #ffffff;
  --input-focus-shadow: rgba(99, 102, 241, 0.15);
  
  /* Nav variables */
  --nav-bg: rgba(255, 255, 255, 0.7);
  --nav-link-color: #475569;
  --nav-link-hover-bg: rgba(99, 102, 241, 0.1);
  --nav-link-hover-color: #6366f1;
  
  /* Badge state (pendiente, en proceso, resuelta) */
  --badge-pendiente-bg: #fef9c3;
  --badge-pendiente-color: #713f12;
  --badge-pendiente-border: #fde047;
  
  --badge-proceso-bg: #fee2e2;
  --badge-proceso-color: #991b1b;
  --badge-proceso-border: #fca5a5;
  
  --badge-resuelta-bg: #dcfce7;
  --badge-resuelta-color: #14532d;
  --badge-resuelta-border: #86efac;
  
  /* Badge urgencia/prioridad (Alta, Media, Baja) */
  --badge-alta-bg: #fee2e2;
  --badge-alta-color: #991b1b;
  --badge-alta-border: #fca5a5;
  
  --badge-media-bg: #ffedd5;
  --badge-media-color: #7c2d12;
  --badge-media-border: #fed7aa;
  
  --badge-baja-bg: #f1f5f9;
  --badge-baja-color: #334155;
  --badge-baja-border: #cbd5e1;

  /* Button ghost */
  --btn-ghost-hover: #f1f5f9;
  
  /* Additional UI variables */
  --avatar-shadow: rgba(99, 102, 241, 0.3);
  --card-shadow: rgba(0, 0, 0, 0.06);
  --hero-gradient: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(236, 72, 153, 0.04));
  --divider-color: rgba(99, 102, 241, 0.15);
}

body.dark-mode {
  --primary: #818cf8;       /* Indigo 400 */
  --primary-hover: #a5b4fc;
  --secondary: #f472b6;     /* Pink 400 */
  --bg-gradient: linear-gradient(135deg, #090d16 0%, #111827 100%);
  --card-bg: rgba(17, 24, 39, 0.8);
  --card-border: rgba(255, 255, 255, 0.08);
  --text-main: #f3f4f6;
  --text-muted: #9ca3af;
  --border: rgba(129, 140, 248, 0.25);
  
  /* Input variables */
  --input-bg: rgba(17, 24, 39, 0.95);
  --input-border: #374151;
  --input-color: #f3f4f6;
  --input-focus-bg: #090d16;
  --input-focus-shadow: rgba(129, 140, 248, 0.25);
  
  /* Nav variables */
  --nav-bg: rgba(17, 24, 39, 0.85);
  --nav-link-color: #9ca3af;
  --nav-link-hover-bg: rgba(129, 140, 248, 0.15);
  --nav-link-hover-color: #818cf8;
  
  /* Badge state - glowing neon colors */
  --badge-pendiente-bg: rgba(253, 224, 71, 0.12);
  --badge-pendiente-color: #fef08a;
  --badge-pendiente-border: rgba(253, 224, 71, 0.25);
  
  --badge-proceso-bg: rgba(239, 68, 68, 0.12);
  --badge-proceso-color: #fca5a5;
  --badge-proceso-border: rgba(239, 68, 68, 0.25);
  
  --badge-resuelta-bg: rgba(34, 197, 94, 0.12);
  --badge-resuelta-color: #86efac;
  --badge-resuelta-border: rgba(34, 197, 94, 0.25);
  
  /* Badge urgencia/prioridad - glowing neon colors */
  --badge-alta-bg: rgba(239, 68, 68, 0.12);
  --badge-alta-color: #fca5a5;
  --badge-alta-border: rgba(239, 68, 68, 0.25);
  
  --badge-media-bg: rgba(249, 115, 22, 0.12);
  --badge-media-color: #fed7aa;
  --badge-media-border: rgba(249, 115, 22, 0.25);
  
  --badge-baja-bg: rgba(75, 85, 99, 0.2);
  --badge-baja-color: #d1d5db;
  --badge-baja-border: rgba(75, 85, 99, 0.3);

  /* Button ghost */
  --btn-ghost-hover: rgba(255, 255, 255, 0.08);
  
  /* Additional UI variables */
  --avatar-shadow: rgba(129, 140, 248, 0.4);
  --card-shadow: rgba(0, 0, 0, 0.4);
  --hero-gradient: linear-gradient(135deg, rgba(129, 140, 248, 0.15), rgba(244, 114, 182, 0.05));
  --divider-color: rgba(129, 140, 248, 0.25);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Outfit', system-ui, Arial, sans-serif;
  background: var(--bg-gradient);
  color: var(--text-main);
  line-height: 1.5;
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

body::before {
  content: ""; position: fixed; top: -10%; left: -10%; width: 50vw; height: 50vw;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
  z-index: -1; pointer-events: none;
}
body::after {
  content: ""; position: fixed; bottom: -10%; right: -10%; width: 50vw; height: 50vw;
  background: radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%);
  z-index: -1; pointer-events: none;
}

@keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
.container { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); max-width: 880px; margin: -2rem auto 3rem; padding: 0 24px; position: relative; z-index: 2; }

.topnav {
  display: flex; gap: 8px; align-items: center; justify-content: space-between;
  padding: 16px 24px;
  background: var(--nav-bg);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 10;
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.08);
}
.topnav .brand { font-weight: 800; font-size: 1.4rem; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.5px; }
.topnav .links { display: flex; gap: 8px; flex-wrap: wrap; }
.topnav a {
  color: var(--nav-link-color); text-decoration: none;
  padding: 8px 18px; border-radius: 999px; font-weight: 700;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.topnav a:hover { color: var(--nav-link-hover-color); background: var(--nav-link-hover-bg); transform: translateY(-1px); }
.topnav a.active {
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.35);
}

.hero {
  background: var(--hero-gradient);
  color: var(--text-main);
  padding: 4rem 1rem 5rem;
  text-align: center;
  border-bottom: 1px solid var(--border);
  position: relative;
  z-index: 1;
}
.hero h1 { margin: 0; font-size: 2.8rem; font-weight: 800; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -1px; }
.hero p { margin: 1rem 0 0; color: var(--text-muted); font-size: 1.2rem; font-weight: 400; }

h2, h3 { color: var(--text-main); margin: 0; font-weight: 800; letter-spacing: -0.5px; }

.card, .consulta-card {
  background: var(--card-bg);
  border-radius: 20px;
  border: 1px solid var(--card-border);
  box-shadow: 0 10px 40px var(--card-shadow), inset 0 0 0 1px var(--border);
  padding: 28px; margin-bottom: 24px;
  backdrop-filter: blur(12px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.consulta-card:hover {
  transform: translateY(-8px) scale(1.01);
  border-color: var(--primary);
  box-shadow: 0 20px 40px rgba(99, 102, 241, 0.15), inset 0 0 0 1px var(--primary);
}

.filtros { display: flex; gap: 16px; align-items: center; }

input, textarea, select {
  width: 100%; padding: 14px 18px; font-size: 15px; font-family: inherit; font-weight: 500;
  color: var(--input-color); background: var(--input-bg);
  border: 2px solid var(--input-border); border-radius: 14px; outline: none;
  transition: all 0.3s ease;
}
input:focus, textarea:focus, select:focus {
  border-color: var(--primary);
  background: var(--input-focus-bg);
  box-shadow: 0 0 0 4px var(--input-focus-shadow);
}

.list-header { display: flex; align-items: center; justify-content: space-between; margin: 2.5rem .5rem 1.5rem; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }

.consulta-top { display: flex; align-items: center; gap: 1rem; }
.avatar {
  width: 50px; height: 50px; border-radius: 16px;
  display: grid; place-items: center; font-weight: 800; font-size: 1.3rem;
  box-shadow: 0 4px 15px var(--avatar-shadow);
  transform: rotate(-5deg);
  transition: transform 0.3s ease;
}
.consulta-card:hover .avatar { transform: rotate(0deg) scale(1.05); }

.consulta-info strong { color: var(--text-main); font-size: 1.15rem; font-weight: 700; letter-spacing: -0.3px; }
.consulta-info .asunto { color: var(--primary); font-size: .85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
.mensaje { color: var(--text-muted); margin: 1.2rem 0; font-size: 1rem; line-height: 1.6; }
.consulta-actions { display: flex; gap: .6rem; flex-wrap: wrap; margin-top: 1.2rem; align-items: center; padding-top: 1rem; border-top: 1px dashed var(--divider-color); }

.badge { display: inline-flex; align-items: center; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
.badge-pendiente { background: var(--badge-pendiente-bg); color: var(--badge-pendiente-color); border: 1px solid var(--badge-pendiente-border); }
.badge-en-proceso { background: var(--badge-proceso-bg); color: var(--badge-proceso-color); border: 1px solid var(--badge-proceso-border); }
.badge-resuelta { background: var(--badge-resuelta-bg); color: var(--badge-resuelta-color); border: 1px solid var(--badge-resuelta-border); }

.badge-Alta { background: var(--badge-alta-bg); color: var(--badge-alta-color); border: 1px solid var(--badge-alta-border); }
.badge-Media { background: var(--badge-media-bg); color: var(--badge-media-color); border: 1px solid var(--badge-media-border); }
.badge-Baja { background: var(--badge-baja-bg); color: var(--badge-baja-color); border: 1px solid var(--badge-baja-border); }

.btn { cursor: pointer; border: none; padding: 14px 28px; font-size: 15px; font-weight: 800; border-radius: 14px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); letter-spacing: 0.5px; }
.btn-primary { background: linear-gradient(135deg, var(--primary), var(--secondary)); color: #fff; box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3); }
.btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4); }

.btn-danger { background: #fee2e2; color: #ef4444; }
.btn-danger:hover { background: #fecaca; transform: translateY(-2px); }

.error { color: #ef4444; text-align: center; font-weight: 700; background: #fee2e2; padding: 12px; border-radius: 12px; }
.empty { text-align: center; padding: 4rem 1rem; color: var(--text-muted); font-weight: 600; font-size: 1.1rem; }

.btn-ghost {
  border: 1px solid var(--border);
  color: var(--text-main);
  background: transparent;
  padding: 6px 14px;
  font-size: 0.85rem;
  border-radius: 8px;
  font-weight: 700;
  transition: all 0.3s ease;
}
.btn-ghost:hover {
  background: rgba(139, 92, 246, 0.15);
}
</style>
