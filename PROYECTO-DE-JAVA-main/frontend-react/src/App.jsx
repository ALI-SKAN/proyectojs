import { useState, useEffect } from 'react'
import { InputFactory } from './patterns/InputFactory'
import { requiredStrategy, emailStrategy, minLengthStrategy, dniStrategy, phoneStrategy, fullNameStrategy } from './patterns/ValidationStrategy'
import { ConsultaCommand } from './patterns/ConsultaCommand'
import { Nav } from './components/Nav'
import { LoginForm } from './components/LoginForm'
import { Chatbot } from './components/Chatbot'
import PanelEstudiante from './components/PanelEstudiante'

const API = '/api/consultas'

const FORM_VACIO = { 
  estudiante: '', 
  dni: '',
  titulo: '', 
  descripcion: '', 
  categoria: 'general', 
  urgencia: 'normal', 
  canal: 'plataforma',
  telefono: '',
  correo: '',
  adjuntoBase64: '',
  adjuntoNombre: ''
}

// Helper audio
const playChime = (type = 'success') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (type === 'success') {
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.3);
    } else if (type === 'error') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [role, setRole] = useState(localStorage.getItem('role') || '')
  const [username, setUsername] = useState(localStorage.getItem('username') || '')
  
  const [loginError, setLoginError] = useState('')
  const [shakeLogin, setShakeLogin] = useState(false);

  const [form, setForm] = useState(FORM_VACIO)
  const [mensaje, setMensaje] = useState('')
  const [siguienteId, setSiguienteId] = useState('')
  const [errors, setErrors] = useState({})

  const [step, setStep] = useState(1)
  const [filePreview, setFilePreview] = useState('')
  
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    const borrador = localStorage.getItem('borrador_consulta');
    if (borrador) {
      try {
        const parsed = JSON.parse(borrador);
        setForm(parsed);
        if (parsed.adjuntoBase64) {
          if (parsed.adjuntoBase64.startsWith('data:image/')) setFilePreview(parsed.adjuntoBase64);
          else setFilePreview('pdf-icon');
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (JSON.stringify(form) !== JSON.stringify(FORM_VACIO)) {
      localStorage.setItem('borrador_consulta', JSON.stringify(form));
    }
  }, [form]);

  const fetchSiguienteId = async () => {
    try {
      const headers = {};
      const t = token || localStorage.getItem('token');
      if (t) headers['Authorization'] = `Bearer ${t}`;
      const res = await fetch('/api/consultas/siguiente-ticket', { headers });
      if (res.ok) {
        const data = await res.json();
        setSiguienteId(data.id);
      }
    } catch (err) {
      console.error('Error fetching ticket ID:', err);
    }
  };

  useEffect(() => {
    fetchSiguienteId();
  }, [token]);

  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'theme') setIsDark(e.newValue === 'dark');
      if (e.key === 'token') {
        setToken(e.newValue || '');
        if (!e.newValue) setUsername('');
      }
      if (e.key === 'role') setRole(e.newValue || '');
      if (e.key === 'username') setUsername(e.newValue || '');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleToggleTheme = () => setIsDark(prev => !prev);

  const handleLogin = async (loginForm) => {
    setLoginError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciales incorrectas');
      
      playChime('success');
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', loginForm.username);
      setToken(data.token);
      setRole(data.role);
      setUsername(loginForm.username);
    } catch (err) {
      playChime('error');
      setShakeLogin(true);
      setTimeout(() => setShakeLogin(false), 500);
      setLoginError(err.message);
    }
  };

  const handleLogout = () => {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      setToken('');
      setRole('');
      setUsername('');
    });
  };

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value })
    
    if (name === 'dni') setErrors(prev => ({ ...prev, dni: dniStrategy.validate(value) }));
    else if (name === 'telefono') setErrors(prev => ({ ...prev, telefono: phoneStrategy.validate('+51 ' + value) }));
    else if (name === 'estudiante') setErrors(prev => ({ ...prev, estudiante: fullNameStrategy.validate(value) }));
    else if (name === 'correo') setErrors(prev => ({ ...prev, correo: emailStrategy.validate(value + '@gmail.com') }));
  }

  const removeAttachment = () => {
    setForm(prev => ({ ...prev, adjuntoBase64: '', adjuntoNombre: '' }));
    setFilePreview('');
  };

  const registrarConsulta = async (e) => {
    e.preventDefault()
    try {
      const payloadForm = { 
        ...form, 
        telefono: '+51 ' + form.telefono,
        correo: form.correo + '@gmail.com'
      };
      
      // PATRÓN COMMAND: Encapsula el comportamiento y la ejecución
      const command = new ConsultaCommand(API, token);
      const data = await command.execute(payloadForm);

      setMensaje(`Consulta registrada correctamente. Tu número de ticket asignado es: Nº ${data.id}`);
      playChime('success');
      setForm(FORM_VACIO);
      localStorage.removeItem('borrador_consulta');
      setFilePreview('');
      setStep(1);
      fetchSiguienteId();
    } catch (err) {
      setMensaje('Error al registrar: ' + err.message)
    }
  }

  if (!token) {
    return (
      <div>
        <div className="blob-bg-wrapper">
          <div className="neon-blob neon-blob-1"></div>
          <div className="neon-blob neon-blob-2"></div>
        </div>
        <Nav token={token} onLogout={handleLogout} isDark={isDark} onToggleTheme={handleToggleTheme} />
        <LoginForm onLogin={handleLogin} shakeLogin={shakeLogin} loginError={loginError} />
      </div>
    );
  }

  if (role === 'estudiante') {
    return <PanelEstudiante token={token} isDark={isDark} handleLogout={handleLogout} handleToggleTheme={handleToggleTheme} isLoading={!token} />;
  }

  return (
    <div>
      <div className="blob-bg-wrapper">
        <div className="neon-blob neon-blob-1"></div>
        <div className="neon-blob neon-blob-2"></div>
      </div>
      <Nav token={token} role={role} onLogout={handleLogout} isDark={isDark} onToggleTheme={handleToggleTheme} />
      <div className="hero">
        <h1>🎓 Registro de Consultas</h1>
        <p>Registra consultas en el sistema de atención al estudiante.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 24px 3rem' }}>
        <div id="form-section" style={{ maxWidth: '600px', width: '100%' }}>
          <form className="card glass-card" onSubmit={registrarConsulta} style={{ overflow: 'hidden' }}>
            <h2 className="card-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>📝 Registro de Consulta</h2>
            
            <div className="stepper-container">
              <div className="stepper-line"></div>
              <div className="stepper-progress-line" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
              <div className={`step-bubble ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
              <div className={`step-bubble ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
              <div className={`step-bubble ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>3</div>
            </div>

            {step === 1 && (
              <div className="form-grid step-slide-enter-active">
                <InputFactory type="text" name="estudiante" label="Estudiante" placeholder="Ej. Ana Torres" value={form.estudiante} onChange={cambiar} required={true} error={errors.estudiante} />
                <InputFactory type="text" name="dni" label="Número de DNI" placeholder="Ej. 12345678" value={form.dni || ''} onChange={cambiar} required={true} error={errors.dni} />
                <InputFactory type="text" name="telefono" label="Celular" placeholder="Ej. 987654321" value={form.telefono || ''} onChange={cambiar} required={true} error={errors.telefono} prefix="+51" />
                <InputFactory type="text" name="correo" label="Correo (Solo nombre)" placeholder="Ej. estudiante" value={form.correo || ''} onChange={cambiar} required={true} error={errors.correo} suffix="@gmail.com" />
                <div className="field field-full" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={!form.estudiante} onClick={() => {
                      const errs = {};
                      errs.estudiante = requiredStrategy.validate(form.estudiante) || fullNameStrategy.validate(form.estudiante);
                      errs.dni = requiredStrategy.validate(form.dni) || dniStrategy.validate(form.dni);
                      errs.telefono = requiredStrategy.validate(form.telefono) || phoneStrategy.validate('+51 ' + form.telefono);
                      errs.correo = requiredStrategy.validate(form.correo) || emailStrategy.validate(form.correo + '@gmail.com');
                      setErrors(errs);
                      if (!Object.values(errs).some(e => e !== null)) setStep(2);
                    }}>Siguiente Paso &rarr;</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="form-grid step-slide-enter-active">
                <InputFactory type="text" name="titulo" label="Título / Asunto" placeholder="Resumen" value={form.titulo} onChange={cambiar} required={true} error={errors.titulo} />
                <InputFactory type="select" name="categoria" label="Categoría" value={form.categoria} onChange={cambiar} options={[{ value: 'academica', label: '📚 Académica' }, { value: 'administrativa', label: '📋 Administrativa' }, { value: 'tecnica', label: '💻 Técnica' }, { value: 'general', label: '📌 General' }]} />
                <InputFactory type="select" name="urgencia" label="Urgencia" value={form.urgencia} onChange={cambiar} options={[{ value: 'inmediata', label: '🔴 Inmediata' }, { value: 'urgente', label: '🟠 Urgente' }, { value: 'normal', label: '🟡 Normal' }, { value: 'baja', label: '🟢 Baja' }]} />
                <InputFactory type="select" name="canal" label="Canal" value={form.canal} onChange={cambiar} options={[{ value: 'presencial', label: '🏫 Presencial' }, { value: 'email', label: '📧 Email' }, { value: 'plataforma', label: '💻 Plataforma' }, { value: 'telefono', label: '📞 Teléfono' }]} />
                <InputFactory type="textarea" name="descripcion" label="Descripción detallada" placeholder="Describe..." value={form.descripcion} onChange={cambiar} required={true} maxLength={500} error={errors.descripcion}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: form.descripcion.length > 450 ? '#ef4444' : 'var(--text-muted)' }}>{form.descripcion.length} / 500</span>
                </InputFactory>
                <div className="field field-full" style={{ display: 'flex', gap: '12px', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', color: 'var(--text-main)' }} onClick={() => setStep(1)}>&larr; Atrás</button>
                  <button type="button" className="btn btn-primary" style={{ flex: 1, padding: '12px' }} disabled={!form.titulo || !form.descripcion || !form.categoria || !form.urgencia || !form.canal} onClick={() => {
                      const errs = { ...errors };
                      errs.titulo = requiredStrategy.validate(form.titulo);
                      errs.descripcion = minLengthStrategy(10).validate(form.descripcion);
                      errs.categoria = requiredStrategy.validate(form.categoria);
                      errs.urgencia = requiredStrategy.validate(form.urgencia);
                      errs.canal = requiredStrategy.validate(form.canal);
                      setErrors(errs);
                      if (!Object.values(errs).some(e => e !== null)) setStep(3);
                    }}>Siguiente Paso &rarr;</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="form-grid step-slide-enter-active">
                <div className="field field-full">
                  <label>Número de Ticket Reservado</label>
                  <input type="text" value={siguienteId ? `Nº ${siguienteId}` : 'Cargando...'} readOnly style={{ background: 'var(--divider-color)', fontWeight: 'bold', color: 'var(--primary)', textAlign: 'center' }} />
                </div>
                
                <div className="field field-full">
                  <label>Adjunto (Opcional)</label>
                  <input type="file" accept="image/*,application/pdf" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => {
                          setForm(prev => ({ ...prev, adjuntoBase64: reader.result, adjuntoNombre: file.name }));
                          if (file.type.startsWith('image/')) setFilePreview(reader.result);
                          else setFilePreview('pdf-icon');
                        };
                        reader.readAsDataURL(file);
                      }
                    }} style={{ padding: '8px' }} />
                  {form.adjuntoNombre && (
                    <div className="file-preview-card">
                      {filePreview === 'pdf-icon' ? <span style={{ fontSize: '1.8rem' }}>📄</span> : <img src={filePreview} alt="Adjunto" className="file-preview-thumbnail" />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.adjuntoNombre}</div>
                      </div>
                      <button type="button" onClick={removeAttachment} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>Eliminar</button>
                    </div>
                  )}
                </div>

                <div className="field field-full" style={{ marginTop: '10px', background: 'rgba(0,0,0,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Resumen</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.85rem' }}>
                    <div>👤 {form.estudiante}</div>
                    <div>💳 {form.dni}</div>
                    <div>📱 +51 {form.telefono}</div>
                    <div>📧 {form.correo}@gmail.com</div>
                  </div>
                </div>

                <div className="field field-full" style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-ghost" style={{ flex: 1, padding: '12px', border: '1px solid var(--border)', color: 'var(--text-main)' }} onClick={() => setStep(2)}>&larr; Atrás</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>🚀 Registrar Ticket</button>
                </div>
              </div>
            )}
          </form>
          {mensaje && <p style={{color: '#7c3aed', textAlign: 'center', fontWeight: 'bold', marginTop: '15px'}}>{mensaje}</p>}
        </div>
      </div>
      <Chatbot />
    </div>
  )
}

export default App
