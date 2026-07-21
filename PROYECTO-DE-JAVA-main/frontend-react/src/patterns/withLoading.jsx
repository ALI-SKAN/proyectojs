import React from 'react';

// Decorator Pattern (HOC - Higher Order Component): 
// Envuelve un componente para añadirle la funcionalidad visual de "Cargando..."
export function withLoading(WrappedComponent) {
  return function WithLoadingComponent({ isLoading, loadingMessage = 'Cargando...', ...props }) {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', flexDirection: 'column' }}>
          <div className="pulse-dot" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', marginBottom: '15px' }}></div>
          <p style={{ fontWeight: 'bold', color: 'var(--primary)' }}>{loadingMessage}</p>
        </div>
      );
    }
    return <WrappedComponent {...props} />;
  };
}
