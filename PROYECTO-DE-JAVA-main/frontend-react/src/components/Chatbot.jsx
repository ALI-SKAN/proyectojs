import React, { useState } from 'react';

const playChime = (type = 'message') => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'message') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

const hablarText = (text) => {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'es-ES';
  window.speechSynthesis.speak(utterance);
};

export function Chatbot() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: '¡Hola! 🎓 Soy tu Asistente Virtual. ¿En qué puedo ayudarte hoy?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleChatSend = (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    playChime('message');
    const question = chatInput.toLowerCase().trim();
    setChatInput('');
    
    setTimeout(() => {
      let replyText = 'Disculpa, no entiendo esa consulta. ¿Podrías intentar con otra palabra clave como "SLA", "pabellón" o "login"?';
      if (question.includes('sla') || question.includes('plazo') || question.includes('tiempo')) {
        replyText = '🕒 El plazo de atención SLA varía según la urgencia de tu consulta:\n• Inmediata: 2 horas\n• Urgente: 8 horas\n• Normal: 24 horas\n• Baja: 48 horas';
      } else if (question.includes('pabellon') || question.includes('pabellón') || question.includes('oficina') || question.includes('donde') || question.includes('dónde') || question.includes('ubicacion')) {
        replyText = '📍 Puedes ver el mapa del campus interactivo en la pestaña "Estado". El sistema calculará la ruta más corta por Dijkstra desde el ingreso hasta tu Pabellón de destino.';
      } else if (question.includes('login') || question.includes('sesion') || question.includes('sesión') || question.includes('password') || question.includes('contra') || question.includes('credenciales')) {
        replyText = '🔐 Las credenciales de administrador por defecto para probar el sistema son:\n• Usuario: admin\n• Contraseña: admin123';
      } else if (question.includes('hola') || question.includes('buenos') || question.includes('tardes') || question.includes('dias')) {
        replyText = '¡Hola! 🎓 ¿Qué duda tienes sobre los trámites estudiantiles o la ubicación de las oficinas?';
      }
      
      setChatMessages(prev => [...prev, { sender: 'bot', text: replyText }]);
      playChime('message');
    }, 800);
  };

  return (
    <>
      <button className="chatbot-trigger-btn" onClick={() => setChatOpen(!chatOpen)}>
        💬
      </button>

      {chatOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>🎓 Asistente Virtual</span>
            <button 
              onClick={() => setChatOpen(false)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
          
          <div className="chatbot-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.sender}`} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                {msg.sender === 'bot' && (
                  <button 
                    type="button"
                    onClick={() => hablarText(msg.text)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', alignSelf: 'flex-start', padding: '4px 0 0 0', opacity: 0.7, color: 'var(--primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px' }}
                    title="Escuchar mensaje"
                  >
                    🔊 Escuchar
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <form className="chatbot-input-area" onSubmit={handleChatSend}>
            <input 
              type="text" 
              className="chatbot-input" 
              placeholder="Escribe tu duda..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="chatbot-send-btn">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
