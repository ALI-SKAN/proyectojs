export interface ElementoPrioridad<T> {
  datos: T;
  prioridad: number; // Menor valor = Mayor prioridad (1: inmediata, 2: urgente, 3: normal, 4: baja)
  fechaCreacion: Date;
}

export class ColaPrioridad<T> {
  private items: ElementoPrioridad<T>[] = [];

  enqueue(datos: T, prioridad: number, fechaCreacion: Date): void {
    const nuevoElemento: ElementoPrioridad<T> = { datos, prioridad, fechaCreacion };
    let encolado = false;

    for (let i = 0; i < this.items.length; i++) {
      // Prioridad numérica menor va primero (inmediata: 1 vs normal: 3).
      // Si las prioridades son iguales, se desempata por la fecha de creación más antigua.
      if (
        prioridad < this.items[i].prioridad ||
        (prioridad === this.items[i].prioridad && fechaCreacion < this.items[i].fechaCreacion)
      ) {
        this.items.splice(i, 0, nuevoElemento);
        encolado = true;
        break;
      }
    }

    if (!encolado) {
      this.items.push(nuevoElemento);
    }
  }

  dequeue(): T | undefined {
    const elem = this.items.shift();
    return elem ? elem.datos : undefined;
  }

  peek(): T | undefined {
    return this.items.length > 0 ? this.items[0].datos : undefined;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  getTodos(): ElementoPrioridad<T>[] {
    return [...this.items];
  }

  clear(): void {
    this.items = [];
  }
}
