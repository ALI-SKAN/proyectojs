// Proxy Pattern: Intercepta el acceso a las propiedades de la consulta
export const crearConsultaProxy = (consulta) => {
  return new Proxy(consulta, {
    get(target, prop) {
      if (prop === 'fechaFormateada') {
        const fechaStr = target.fechaActualizacion || target.fechaCreacion || target.fecha;
        if (!fechaStr) return 'Sin fecha';
        return new Date(fechaStr).toLocaleDateString('es-ES', { 
          day: '2-digit', month: 'short', year: 'numeric', 
          hour: '2-digit', minute: '2-digit' 
        });
      }
      if (prop === 'estadoColor') {
        switch (target.estado?.toLowerCase()) {
          case 'pendiente': return '#f59e0b';
          case 'en proceso': return '#3b82f6';
          case 'resuelta': return '#10b981';
          default: return '#94a3b8';
        }
      }
      return target[prop];
    }
  });
};
