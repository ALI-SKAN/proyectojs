import React, { useState, useEffect } from 'react';
import { Nav } from './Nav';

function PanelEstudiante({ token, isDark, handleLogout, handleToggleTheme }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMisTickets = async () => {
      try {
        const res = await fetch('/api/consultas/mis-tickets', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTickets(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMisTickets();
  }, [token]);

  return (
    <div>
      <div className="blob-bg-wrapper">
        <div className="neon-blob neon-blob-1"></div>
        <div className="neon-blob neon-blob-2"></div>
      </div>
      <Nav token={token} role="estudiante" onLogout={handleLogout} isDark={isDark} onToggleTheme={handleToggleTheme} />
      <div className="hero">
        <h1>Mis Trámites</h1>
        <p>Revisa el progreso de tus consultas de forma segura.</p>
        <button 
          onClick={() => window.print()} 
          className="btn btn-ghost" 
          style={{ marginTop: '1rem', padding: '10px 20px', display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border)', background: 'var(--glass-bg)' }}
        >
          🖨️ Imprimir Reporte
        </button>
      </div>
      <main className="container" style={{ padding: '0 24px 3rem' }}>
        {loading ? (
          <p style={{textAlign:'center', fontWeight:'bold', color:'var(--primary)'}}>Cargando tus trámites...</p>
        ) : tickets.length === 0 ? (
          <p className="empty" style={{textAlign: 'center', padding: '2rem'}}>No tienes consultas registradas todavía.</p>
        ) : (
          <div className="grid">
            {tickets.map(c => (
              <div key={c.id} className={`consulta-card`}>
                <div className="consulta-top">
                  <div className="avatar" style={{background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', color: 'white'}}>{c.estudiante.charAt(0).toUpperCase()}</div>
                  <div className="consulta-info">
                    <strong>{c.estudiante}</strong>
                    <div className="asunto">{c.categoria || 'General'} • {c.asunto}</div>
                  </div>
                </div>
                
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px', background: 'rgba(0,0,0,0.02)', padding: '6px 10px', borderRadius: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
                  {c.telefono && (
                    <div style={{display:'inline-flex', alignItems: 'center'}}>📞 {c.telefono}</div>
                  )}
                  {c.correo && (
                    <div style={{display:'inline-flex', alignItems: 'center'}}>📧 {c.correo}</div>
                  )}
                </div>
 
                <p className="mensaje">{c.resumenIA || c.mensaje}</p>
                
                <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px'}}>
                  <div>Última actualización: {new Date(c.fechaActualizacion || c.fechaCreacion).toLocaleString()}</div>
                </div>
                <div className="consulta-actions">
                  <span className={`badge badge-${(c.estado || 'pendiente').replace(' ', '-')}`}>{c.estado || 'pendiente'}</span>
                  <span className={`badge badge-${c.prioridad || 'Media'}`}>Prioridad: {c.prioridad || 'Media'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Envuelto con el HOC (High-Order Component Decorator) para mostrar loading visual
import { withLoading } from '../patterns/withLoading';
export default withLoading(PanelEstudiante);
