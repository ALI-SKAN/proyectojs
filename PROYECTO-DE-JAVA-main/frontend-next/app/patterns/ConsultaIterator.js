// Iterator Pattern: Proporciona una forma de acceder secuencialmente a los elementos de una colección agregada sin exponer su representación subyacente.
export class ConsultaIterator {
  constructor(consultas) {
    this.consultas = consultas || [];
    this.index = 0;
  }

  hasNext() {
    return this.index < this.consultas.length;
  }

  next() {
    return this.hasNext() ? this.consultas[this.index++] : null;
  }

  reset() {
    this.index = 0;
  }

  // Utilidad para iterar y extraer datos estadísticos
  aggregateByCategoria() {
    this.reset();
    const categories = {};
    while (this.hasNext()) {
      const c = this.next();
      const cat = c.categoria || 'general';
      categories[cat] = (categories[cat] || 0) + 1;
    }
    return categories;
  }

  aggregateByUrgencia() {
    this.reset();
    const urgencias = {};
    while (this.hasNext()) {
      const c = this.next();
      const u = c.urgencia || 'normal';
      urgencias[u] = (urgencias[u] || 0) + 1;
    }
    return urgencias;
  }
}
