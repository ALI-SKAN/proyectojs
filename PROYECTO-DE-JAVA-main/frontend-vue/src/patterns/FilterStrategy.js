// Strategy Pattern: Define una familia de algoritmos de filtrado, los encapsula y los hace intercambiables.
export const filterStrategies = {
  general: (consultas, busquedaTexto) => {
    return consultas.filter(c => {
      const termino = busquedaTexto.toLowerCase();
      return c.estudiante?.toLowerCase().includes(termino) ||
             c.dni?.includes(termino) ||
             c.asunto?.toLowerCase().includes(termino) ||
             c.mensaje?.toLowerCase().includes(termino);
    });
  },
  
  estado: (consultas, estado) => {
    if (!estado) return consultas;
    return consultas.filter(c => c.estado === estado);
  },

  prioridad: (consultas, prioridad) => {
    if (!prioridad) return consultas;
    return consultas.filter(c => c.prioridad === prioridad);
  },
  
  fecha: (consultas, sortDesc = true) => {
    return [...consultas].sort((a, b) => {
      const dateA = new Date(a.fecha).getTime();
      const dateB = new Date(b.fecha).getTime();
      return sortDesc ? dateB - dateA : dateA - dateB;
    });
  }
};

export class FilterContext {
  constructor() {
    this.strategies = [];
  }

  addStrategy(strategy, param) {
    this.strategies.push({ strategy, param });
    return this;
  }

  execute(consultas) {
    let result = [...consultas];
    for (const { strategy, param } of this.strategies) {
      result = strategy(result, param);
    }
    return result;
  }
}
