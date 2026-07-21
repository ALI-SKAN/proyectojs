"use client";

import { useEffect, useState, useMemo } from "react";
import { QueryBuilder } from "./patterns/QueryBuilder";
import { crearConsultaProxy } from "./patterns/ConsultaProxy";
import { BaseLayout } from "./patterns/BaseLayout";
import { ConsultaIterator } from "./patterns/ConsultaIterator";

const API = "/api/consultas";

function Nav({ token, onLogout, isDark, onToggleTheme }) {
  return (
    <nav className="topnav" style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '2rem' }}>
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        🎓 Portal Estudiantil
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
          <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
          Conectado
        </span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }} className="links">
        <a href="/registrar">Registrar</a>
        <a href="/editar">Editar</a>
        <a href="/filtrar">Filtrar</a>
        <a href="/estado" className="active">Estado</a>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onToggleTheme}
          className="btn btn-ghost"
          style={{ padding: '6px 14px', fontSize: '0.85rem', color: 'var(--text-main)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: 'transparent' }}
        >
          {isDark ? '☀️ Claro' : '🌙 Oscuro'}
        </button>
        {token && (
          <button 
            onClick={onLogout} 
            className="btn btn-ghost" 
            style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'var(--primary)' }}
          >
            🚪 Cerrar Sesión
          </button>
        )}
      </div>
    </nav>
  );
}



// COMPONENTE DE HISTORIAL Y AUDITORÍA DE AVANCES
function Timeline({ historial }) {
  if (!historial || historial.length === 0) return null;
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
      <h4 style={{ margin: '0 0 15px 0', fontSize: '0.95rem', color: 'var(--primary)', fontWeight: 'bold' }}>📅 Historial de Avances y Auditoría:</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', paddingLeft: '10px', borderLeft: '2px solid var(--divider-color)' }}>
        {historial.map((h, idx) => (
          <div key={idx} style={{ position: 'relative' }}>
            {/* Timeline dot */}
            <div style={{ 
              position: 'absolute', left: '-17px', top: '4px', width: '10px', height: '10px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
              border: '2px solid var(--card-bg)' 
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-main)' }}>{h.accion}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(h.fecha || h.fechaCreacion).toLocaleString()}</span>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{h.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// COMPONENTE PARA LA VISUALIZACIÓN DE GRAFOS Y CAMINO MÁS CORTO EN SVG
function SVGMap({ ruta, destino, estado, highlightedEdge }) {
  const nodes = [
    { name: 'Ingreso Principal', x: 60, y: 150 },
    { name: 'Plaza Central', x: 200, y: 150 },
    { name: 'Oficina Central (Informes)', x: 200, y: 60 },
    { name: 'Pabellón A (Secretaría)', x: 340, y: 60 },
    { name: 'Pabellón B (Bienestar)', x: 340, y: 240 },
    { name: 'Biblioteca', x: 340, y: 150 },
    { name: 'Pabellón C (Sistemas)', x: 480, y: 150 },
    { name: 'Cafetería Central', x: 480, y: 240 }
  ];

  const edges = [
    { from: 'Ingreso Principal', to: 'Plaza Central', weight: 120 },
    { from: 'Plaza Central', to: 'Oficina Central (Informes)', weight: 30 },
    { from: 'Plaza Central', to: 'Pabellón A (Secretaría)', weight: 70 },
    { from: 'Plaza Central', to: 'Pabellón B (Bienestar)', weight: 90 },
    { from: 'Plaza Central', to: 'Biblioteca', weight: 80 },
    { from: 'Biblioteca', to: 'Pabellón C (Sistemas)', weight: 50 },
    { from: 'Pabellón A (Secretaría)', to: 'Cafetería Central', weight: 60 },
    { from: 'Pabellón B (Bienestar)', to: 'Cafetería Central', weight: 40 },
    { from: 'Pabellón C (Sistemas)', to: 'Pabellón B (Bienestar)', weight: 100 }
  ];

  const isEdgeActive = (from, to) => {
    if (!ruta || ruta.length < 2) return false;
    for (let i = 0; i < ruta.length - 1; i++) {
      if (
        (ruta[i] === from && ruta[i + 1] === to) ||
        (ruta[i] === to && ruta[i + 1] === from)
      ) {
        return true;
      }
    }
    return false;
  };

  const isEdgeHighlighted = (from, to) => {
    if (!highlightedEdge) return false;
    return (
      (highlightedEdge.from === from && highlightedEdge.to === to) ||
      (highlightedEdge.from === to && highlightedEdge.to === from)
    );
  };

  const isNodeActive = (name) => {
    return ruta && ruta.includes(name);
  };

  const targetNode = nodes.find(n => n.name === destino);

  // Colores dinámicos basados en el estado del ticket
  let activePathColor = '#3b82f6'; // Azul por defecto (en proceso)
  let activeNodeColor = '#3b82f6';
  let activeNodeStroke = '#2563eb';
  let statusText = 'En Proceso';

  if (estado === 'resuelta') {
    activePathColor = '#10b981'; // Verde: atendido
    activeNodeColor = '#10b981';
    activeNodeStroke = '#059669';
    statusText = 'Atendido / Resuelto';
  } else if (estado === 'pendiente') {
    activePathColor = '#f59e0b'; // Amarillo/Naranja: falta atender
    activeNodeColor = '#f59e0b';
    activeNodeStroke = '#d97706';
    statusText = 'Falta Atender / Por Atender';
  }

  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', padding: '16px', marginTop: '15px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>🗺️ Mapa del Campus (Estado del Trámite):</h4>
        <span style={{ fontSize: '0.75rem', fontWeight: 'bold', padding: '3px 8px', borderRadius: '12px', background: activePathColor + '20', color: activeNodeStroke }}>
          {statusText}
        </span>
      </div>

      {/* Leyenda de Estado en el Mapa */}
      <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', marginBottom: '12px', color: 'var(--text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></span> Falta Atender
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span> En Proceso
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span> Atendido / Resuelto
        </span>
      </div>

      <div style={{ position: 'relative', width: '100%', height: '260px', background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <svg viewBox="0 0 540 280" width="100%" height="100%" style={{ transition: 'all 0.8s ease' }}>
          <defs>
            <style>{`
              @keyframes dash {
                to {
                  stroke-dashoffset: -20;
                }
              }
              .active-path {
                stroke-dasharray: 6, 4;
                animation: dash 1.2s linear infinite;
              }
              .highlighted-path {
                stroke-dasharray: 4, 2;
                animation: dash 0.6s linear infinite;
                filter: drop-shadow(0 0 5px #ec4899);
              }
            `}</style>
          </defs>

          {/* Group wrapping the entire map with transform for pan and zoom */}
          <g style={{
            transform: targetNode ? `translate(${270 - targetNode.x * 1.3}px, ${140 - targetNode.y * 1.3}px) scale(1.3)` : 'translate(0, 0) scale(1)',
            transformOrigin: '270px 140px',
            transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Enlaces de Aristas */}
            {edges.map((edge, idx) => {
              const fromNode = nodes.find(n => n.name === edge.from);
              const toNode = nodes.find(n => n.name === edge.to);
              if (!fromNode || !toNode) return null;
              const active = isEdgeActive(edge.from, edge.to);
              const highlighted = isEdgeHighlighted(edge.from, edge.to);

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    stroke={highlighted ? '#ec4899' : active ? activePathColor : '#cbd5e1'}
                    strokeWidth={highlighted ? 7 : active ? 4 : 2}
                    className={highlighted ? 'highlighted-path active-path' : active ? 'active-path' : ''}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <circle
                    cx={(fromNode.x + toNode.x) / 2}
                    cy={(fromNode.y + toNode.y) / 2}
                    r={8}
                    fill="white"
                    stroke="#cbd5e1"
                    strokeWidth={1}
                  />
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2 + 3}
                    fontSize="7px"
                    fontWeight="bold"
                    fill="#64748b"
                    textAnchor="middle"
                  >
                    {edge.weight}
                  </text>
                </g>
              );
            })}

            {/* Vértices */}
            {nodes.map((node, idx) => {
              const active = isNodeActive(node.name);
              const isDest = node.name === destino;

              return (
                <g key={`node-${idx}`}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isDest ? 14 : active ? 11 : 9}
                    fill="rgba(99, 102, 241, 0.15)"
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isDest ? 12 : active ? 10 : 8}
                    fill={isDest ? activeNodeColor : active ? activeNodeColor : '#fff'}
                    stroke={isDest ? activeNodeStroke : active ? activeNodeStroke : '#94a3b8'}
                    strokeWidth={3}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  <text
                    x={node.x}
                    y={node.name.includes('Pabellón') || node.name.includes('Oficina') || node.name === 'Cafetería Central' ? node.y - 16 : node.y + 22}
                    fontSize="8px"
                    fontWeight="bold"
                    fill="var(--text-main)"
                    textAnchor="middle"
                  >
                    {node.name.replace(' (Secretaría)', '').replace(' (Bienestar)', '').replace(' (Sistemas)', '').replace(' (Informes)', '')}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
}

// COMPONENTE DE CUENTA REGRESIVA DE SLA EN TIEMPO REAL
function SLACountdown({ limite }) {
  const [tiempoRestante, setTiempoRestante] = useState("");
  const [expirado, setExpirado] = useState(false);

  useEffect(() => {
    if (!limite) return;
    
    const actualizarReloj = () => {
      const ahora = new Date().getTime();
      const target = new Date(limite).getTime();
      const diff = target - ahora;

      if (diff <= 0) {
        setTiempoRestante("🔴 PLAZO SLA VENCIDO");
        setExpirado(true);
      } else {
        const horas = Math.floor(diff / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diff % (1000 * 60)) / 1000);
        setTiempoRestante(`⏳ SLA Restante: ${horas}h ${minutos}m ${segundos}s`);
        setExpirado(false);
      }
    };

    actualizarReloj();
    const interval = setInterval(actualizarReloj, 1000);
    return () => clearInterval(interval);
  }, [limite]);

  if (!limite) return null;
  return (
    <div style={{
      fontSize: '0.85rem',
      fontWeight: '800',
      color: expirado ? '#ef4444' : '#10b981',
      background: expirado ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
      padding: '8px 12px',
      borderRadius: '8px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      marginTop: '10px',
      border: `1px solid ${expirado ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
    }}>
      {tiempoRestante}
    </div>
  );
}

export default function HomePage() {
  const [consultas, setConsultas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sel, setSel] = useState(null);
  const [rutaOficina, setRutaOficina] = useState(null);
  const [highlightedEdge, setHighlightedEdge] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const [isDark, setIsDark] = useState(false);
  const [token, setToken] = useState("");

  useEffect(() => {
    setIsDark(localStorage.getItem('theme') === 'dark');
    setToken(localStorage.getItem('token') || "");

    const handleStorageChange = (e) => {
      if (e.key === 'theme') {
        setIsDark(e.newValue === 'dark');
      }
      if (e.key === 'token') {
        setToken(e.newValue || "");
        if (!e.newValue) {
          window.location.href = '/registrar';
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const cargarConsultas = async () => {
    setLoading(true);
    try {
      const url = new QueryBuilder(API).build();
      const res = await fetch(url);
      if (!res.ok) throw new Error("error");
      const data = await res.json();
      setConsultas(data.map(c => crearConsultaProxy(c)));
    } catch {
      setError("No se pudo conectar con la API.");
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const seleccionarTicket = async (ticket) => {
    setSel(ticket);
    setRutaOficina(null);
    if (ticket) {
      try {
        const res = await fetch(`/api/consultas/ruta-oficina/${ticket.id}`);
        if (res.ok) {
          const data = await res.json();
          setRutaOficina(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const cerrarModal = () => {
    setSel(null);
    setRutaOficina(null);
  };

  const handleToggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('theme', nextDark ? 'dark' : 'light');
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      setToken("");
      window.location.href = '/registrar';
    });
  };

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  useEffect(() => {
    cargarConsultas();

    const eventSource = new EventSource('/api/consultas/stream');
    eventSource.addEventListener('create', cargarConsultas);
    eventSource.addEventListener('update', cargarConsultas);
    eventSource.addEventListener('delete', cargarConsultas);

    return () => {
      eventSource.close();
    };
  }, []);

  const stats = useMemo(() => {
    const iterator = new ConsultaIterator(consultas);
    return {
      porCategoria: iterator.aggregateByCategoria(),
      porUrgencia: iterator.aggregateByUrgencia()
    };
  }, [consultas]);

  const consultasFiltradas = consultas.filter((c) => {
    const matchesCat = filtroCategoria === "todos" || c.categoria === filtroCategoria;
    const matchesEst = filtroEstado === "todos" || c.estado === filtroEstado;
    return matchesCat && matchesEst;
  });

  if (error) return <p className="error" style={{textAlign: 'center', padding: '2rem'}}>{error}</p>;

  return (
    <BaseLayout 
      title="Estado de Consultas" 
      subtitle="Revisa el progreso de las incidencias registradas en tiempo real."
      topNav={<Nav token={token} onLogout={handleLogout} isDark={isDark} onToggleTheme={handleToggleTheme} />}
    >
      <main>
        {/* Panel de Estadísticas con el Iterator */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div style={{ flex: 1, background: 'var(--card-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Por Categoría</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(stats.porCategoria).map(([k, v]) => (
                <span key={k} className="badge badge-Media">{k}: {v}</span>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, background: 'var(--card-bg)', padding: '15px', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Por Urgencia</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {Object.entries(stats.porUrgencia).map(([k, v]) => (
                <span key={k} className="badge badge-Alta">{k}: {v}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Filtros Interactivos (Chips) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '18px', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', width: '90px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Categoría:</span>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px' }}>
              {["todos", "academica", "administrativa", "tecnica", "general"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFiltroCategoria(cat)}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: filtroCategoria === cat ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--input-bg)',
                    color: filtroCategoria === cat ? '#fff' : 'var(--text-main)',
                    border: filtroCategoria === cat ? 'none' : '1px solid var(--border)',
                    boxShadow: filtroCategoria === cat ? '0 4px 10px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                >
                  {cat === 'todos' ? '🌐 Todos' : cat === 'academica' ? '📚 Académica' : cat === 'administrativa' ? '📋 Administrativa' : cat === 'tecnica' ? '💻 Técnica' : '📌 General'}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '800', width: '90px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estado:</span>
            <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '6px' }}>
              {["todos", "pendiente", "en proceso", "resuelta"].map((est) => (
                <button
                  key={est}
                  onClick={() => setFiltroEstado(est)}
                  style={{
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: filtroEstado === est ? 'linear-gradient(135deg, var(--primary), var(--secondary))' : 'var(--input-bg)',
                    color: filtroEstado === est ? '#fff' : 'var(--text-main)',
                    border: filtroEstado === est ? 'none' : '1px solid var(--border)',
                    boxShadow: filtroEstado === est ? '0 4px 10px rgba(99, 102, 241, 0.25)' : 'none'
                  }}
                >
                  {est === 'todos' ? '🌐 Todos' : est === 'pendiente' ? '🟡 Pendiente' : est === 'en proceso' ? '🔵 En Proceso' : '🟢 Atendido'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="list-header" style={{ marginTop: '1.5rem' }}>
          <h3>Consultas Activas</h3>
          <span className="count">{consultasFiltradas.length} registros</span>
        </div>

        {loading ? (
          <div className="grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="consulta-card shimmer-element" style={{ height: '220px', border: 'none' }}></div>
            ))}
          </div>
        ) : consultasFiltradas.length === 0 ? (
          <p className="empty">No hay consultas registradas que coincidan con los filtros.</p>
        ) : (
          <div className="grid">
            {consultasFiltradas.map((c) => (
              <div key={c.id} className={`consulta-card estado-${(c.estado || 'pendiente').replace(' ', '-')}`} onClick={() => seleccionarTicket(c)} style={{cursor: 'pointer'}}>
                <div className="consulta-top">
                  <div className="avatar" style={{background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', color: 'white'}}>{c.estudiante.charAt(0).toUpperCase()}</div>
                  <div className="consulta-info">
                    <strong>{c.estudiante}</strong>
                    <div className="asunto">{c.categoria || 'General'} • {c.asunto}</div>
                  </div>
                </div>
                
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', background: 'rgba(0,0,0,0.02)', padding: '6px 10px', borderRadius: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  {c.telefono && (
                    <div style={{display:'inline-flex', alignItems: 'center'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      {c.telefono}
                    </div>
                  )}
                  {c.correo && (
                    <div style={{display:'inline-flex', alignItems: 'center'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {c.correo}
                    </div>
                  )}
                </div>
 
                <p className="mensaje">{c.resumenIA || c.mensaje}</p>
                
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px'}}>
                  <div>Fecha: {c.fechaFormateada}</div>
                  {c.slaLimite && (
                    <div style={{marginTop: '2px', display: 'inline-flex', alignItems: 'center'}}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      Plazo SLA: &nbsp;<span style={{ color: new Date(c.slaLimite) < new Date() ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{new Date(c.slaLimite).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="consulta-actions">
                  <span className="badge" style={{ backgroundColor: c.estadoColor, color: '#fff', border: 'none' }}>{c.estado || 'pendiente'}</span>
                  <span className={`badge badge-${c.prioridad || 'Media'}`}>Prioridad: {c.prioridad || 'Media'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {sel && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(8px)',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
            padding: '2rem 1rem', overflowY: 'auto', zIndex: 100
          }} onClick={cerrarModal}>
            <div className="detail-card" style={{ width: '100%', maxWidth: '650px', margin: 'auto 0', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
              <div className="detail-header">
                <h3 style={{margin: 0, fontSize: '1.4rem'}}>{sel.asunto}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button onClick={() => window.print()} className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem', border: '1px solid var(--border)' }}>
                    🖨️ Imprimir
                  </button>
                  <button className="btn btn-ghost" style={{padding: '6px 12px'}} onClick={cerrarModal}>✕</button>
                </div>
              </div>
              
              {sel.slaLimite && (
                <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                  <SLACountdown limite={sel.slaLimite} />
                </div>
              )}

              <dl className="detail-list" style={{marginBottom: '1.5rem'}}>
                <div><dt>Estudiante</dt><dd>{sel.estudiante}</dd></div>
                {sel.dni && <div><dt>DNI</dt><dd>{sel.dni}</dd></div>}
                {sel.telefono && <div><dt>Teléfono</dt><dd>{sel.telefono}</dd></div>}
                {sel.correo && <div><dt>Correo</dt><dd>{sel.correo}</dd></div>}
                <div><dt>Categoría</dt><dd>{sel.categoria || 'N/A'}</dd></div>
                <div><dt>Prioridad</dt><dd><span className={`badge badge-${sel.prioridad || 'Media'}`}>{sel.prioridad || 'Media'}</span></dd></div>
                <div><dt>Estado</dt><dd><span className="badge" style={{ backgroundColor: sel.estadoColor, color: '#fff' }}>{sel.estado || 'pendiente'}</span></dd></div>
                <div><dt>Fecha</dt><dd>{sel.fechaFormateada}</dd></div>
              </dl>
              {/* GUÍA DE RUTA MÁS CORTA POR DIJKSTRA (GRAFOS) */}
              {rutaOficina && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--primary)', fontSize: '0.95rem' }}>📍 Ruta de Entrega Física:</strong>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                      Distancia: <span style={{ color: 'var(--secondary)' }}>{rutaOficina.distanciaMetros}m</span>
                    </div>
                  </div>
                  
                  {/* Visualizador interactivo de grafo campus con el estado */}
                  <SVGMap ruta={rutaOficina.ruta} destino={rutaOficina.oficinaAsignada} estado={sel.estado} highlightedEdge={highlightedEdge} />

                  {/* Instrucciones de navegación detalladas */}
                  <div style={{ marginTop: '15px', background: 'rgba(99, 102, 241, 0.04)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <strong style={{ fontSize: '0.85rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '8px' }}>
                      📋 Instrucciones de Entrega Paso a Paso:
                    </strong>
                    <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {rutaOficina.ruta.map((nodeName, idx) => {
                        if (idx === rutaOficina.ruta.length - 1) return null;
                        const nextNodeName = rutaOficina.ruta[idx + 1];
                        return (
                          <li 
                            key={idx}
                            onMouseEnter={() => setHighlightedEdge({ from: nodeName, to: nextNodeName })}
                            onMouseLeave={() => setHighlightedEdge(null)}
                            style={{ cursor: 'pointer', transition: 'color 0.2s ease', fontWeight: 600, color: 'var(--text-main)' }}
                          >
                            Camina desde <span style={{ color: 'var(--primary)' }}>{nodeName}</span> hasta <span style={{ color: 'var(--secondary)' }}>{nextNodeName}</span>.
                          </li>
                        );
                      })}
                    </ol>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      💡 Pasa el cursor sobre un tramo para iluminarlo en el mapa.
                    </p>
                  </div>
                </div>
              )}

              <Timeline historial={sel.historial} />
              
              {sel.resumenIA && (
                <div style={{ margin: '0 0 1.5rem', padding: '12px 16px', background: 'rgba(139, 92, 246, 0.08)', borderRadius: '12px', borderLeft: '4px solid var(--primary)', fontSize: '0.9rem' }}>
                  <strong>💡 Resumen IA:</strong>
                  <p style={{ margin: '4px 0 0', color: 'var(--text-main)' }}>{sel.resumenIA}</p>
                </div>
              )}

              <div style={{background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px', marginBottom: '1.5rem'}}>
                <strong>Mensaje detallado:</strong>
                <p style={{margin: '8px 0 0', color: 'var(--text-muted)'}}>{sel.mensaje}</p>
              </div>

              {sel.adjuntoBase64 && (
                <div style={{background: 'rgba(255,255,255,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)'}}>
                  <strong>📎 Adjunto:</strong>
                  <div style={{marginTop: '8px'}}>
                    {sel.adjuntoBase64.startsWith('data:image/') ? (
                      <img src={sel.adjuntoBase64} alt={sel.adjuntoNombre} style={{maxWidth: '100%', maxHeight: '180px', borderRadius: '8px', border: '1px solid #cbd5e1'}} />
                    ) : (
                      <a href={sel.adjuntoBase64} download={sel.adjuntoNombre} style={{color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem'}}>📄 Descargar {sel.adjuntoNombre}</a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </BaseLayout>
  );
}
