import React from 'react';

export function Nav({ token, role, onLogout, isDark, onToggleTheme }) {
  return (
    <nav className="topnav" style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        🎓 Portal Estudiantil
        <a 
          href={token ? '#' : '/'}
          onClick={(e) => { if(token) { e.preventDefault(); onLogout(); } }}
          style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', 
            color: token ? '#10b981' : '#ef4444', 
            background: token ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
            padding: '6px 12px', borderRadius: '15px', fontWeight: 'bold',
            textDecoration: 'none', cursor: 'pointer', border: token ? '1px solid #10b981' : '1px solid #ef4444',
            transition: 'all 0.3s'
          }}
          title={token ? 'Haz clic para cerrar sesión' : 'No conectado'}
        >
          <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: token ? '#10b981' : '#ef4444', display: 'inline-block' }}></span>
          {token ? 'Conectado' : 'Desconectado'}
        </a>
      </div>
      {token && role !== 'estudiante' && (
        <div style={{ display: 'flex', gap: '8px' }} className="links">
          <a href="/registrar" className="active">Registrar</a>
          <a href="/editar">Editar</a>
          <a href="/filtrar">Filtrar</a>
          <a href="/estado">Estado</a>
        </div>
      )}
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
  )
}
