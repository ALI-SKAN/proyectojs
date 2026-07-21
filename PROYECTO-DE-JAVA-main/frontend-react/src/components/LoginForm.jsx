import React, { useState } from 'react';

export function LoginForm({ onLogin, shakeLogin, loginError }) {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(loginForm);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      <div className={`card glass-card ${shakeLogin ? 'shake' : ''}`} style={{ maxWidth: '400px', width: '100%', padding: '30px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="login-lock-icon">🔐</div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 850 }}>Acceso Seguro</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>Ingresa tus credenciales para acceder</p>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="field">
            <label>Usuario o Estudiante</label>
            <input 
              type="text" 
              placeholder="Ej. admin o Ana Torres" 
              value={loginForm.username} 
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} 
              required 
            />
          </div>
          <div className="field">
            <label>Contraseña o DNI</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={loginForm.password} 
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} 
                onKeyUp={(e) => setCapsLockActive(e.getModifierState('CapsLock'))}
                required 
                style={{ paddingRight: '40px' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', padding: 0 }}
              >
                {showPassword ? '👁️' : '🙈'}
              </button>
            </div>
            {capsLockActive && (
              <div style={{ color: '#eab308', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⚠️ Bloq Mayús activo
              </div>
            )}
          </div>
          {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 'bold', textAlign: 'center', margin: 0 }}>❌ {loginError}</p>}
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', padding: '12px' }}>Iniciar Sesión</button>
        </form>
      </div>
    </div>
  );
}
