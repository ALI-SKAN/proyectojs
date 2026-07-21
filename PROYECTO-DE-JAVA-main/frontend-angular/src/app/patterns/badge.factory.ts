// Factory Method Pattern: Encapsula la lógica de creación de atributos visuales 
// sin exponer la lógica de instanciación al cliente.

export class BadgeFactory {
  static getUrgenciaBadgeColor(urgencia: string): string {
    const colores: {[key: string]: string} = {
      'inmediata': '#ef4444', // rojo
      'urgente': '#f97316',   // naranja
      'normal': '#eab308',    // amarillo
      'baja': '#10b981'       // verde
    };
    return colores[urgencia?.toLowerCase()] || '#94a3b8';
  }

  static getBadgeClass(estado: string, prefix: string = 'badge-'): string {
    return prefix + (estado || '').replace(' ', '-');
  }
}
