export class NodoBST<T> {
  clave: string; // Nombre del estudiante en minúsculas para comparaciones
  datos: T;
  izq: NodoBST<T> | null = null;
  der: NodoBST<T> | null = null;

  constructor(clave: string, datos: T) {
    this.clave = clave.trim().toLowerCase();
    this.datos = datos;
  }
}

export class BST<T> {
  private raiz: NodoBST<T> | null = null;

  insert(clave: string, datos: T): void {
    const nuevo = new NodoBST(clave, datos);
    if (this.raiz === null) {
      this.raiz = nuevo;
    } else {
      this.insertarNodo(this.raiz, nuevo);
    }
  }

  private insertarNodo(nodo: NodoBST<T>, nuevo: NodoBST<T>): void {
    if (nuevo.clave < nodo.clave) {
      if (nodo.izq === null) {
        nodo.izq = nuevo;
      } else {
        this.insertarNodo(nodo.izq, nuevo);
      }
    } else {
      // Si la clave es mayor o igual, va a la derecha (permite duplicados del mismo nombre)
      if (nodo.der === null) {
        nodo.der = nuevo;
      } else {
        this.insertarNodo(nodo.der, nuevo);
      }
    }
  }

  // Buscar coincidencia exacta
  buscar(clave: string): T[] {
    const resultados: T[] = [];
    this.buscarNodo(this.raiz, clave.trim().toLowerCase(), resultados);
    return resultados;
  }

  private buscarNodo(nodo: NodoBST<T> | null, clave: string, resultados: T[]): void {
    if (nodo === null) return;

    if (clave === nodo.clave) {
      resultados.push(nodo.datos);
      // Podría haber duplicados a la derecha
      this.buscarNodo(nodo.der, clave, resultados);
    } else if (clave < nodo.clave) {
      this.buscarNodo(nodo.izq, clave, resultados);
    } else {
      this.buscarNodo(nodo.der, clave, resultados);
    }
  }

  // Buscar coincidencia parcial (para filtros de buscador "contiene texto")
  buscarCoincidencias(termino: string): T[] {
    const resultados: T[] = [];
    this.recorridoCoincidencias(this.raiz, termino.trim().toLowerCase(), resultados);
    return resultados;
  }

  private recorridoCoincidencias(nodo: NodoBST<T> | null, termino: string, resultados: T[]): void {
    if (nodo === null) return;

    // Recorrido In-Order (izquierda, nodo, derecha) para obtenerlos en orden alfabético
    this.recorridoCoincidencias(nodo.izq, termino, resultados);

    const estudiante = (nodo.datos as any).estudiante?.toLowerCase() || '';
    const titulo = (nodo.datos as any).titulo?.toLowerCase() || '';
    const descripcion = (nodo.datos as any).descripcion?.toLowerCase() || '';

    if (
      estudiante.includes(termino) ||
      titulo.includes(termino) ||
      descripcion.includes(termino)
    ) {
      resultados.push(nodo.datos);
    }

    this.recorridoCoincidencias(nodo.der, termino, resultados);
  }

  // Obtener todos los elementos ordenados alfabéticamente
  obtenerEnOrden(): T[] {
    const resultados: T[] = [];
    this.inOrder(this.raiz, resultados);
    return resultados;
  }

  private inOrder(nodo: NodoBST<T> | null, resultados: T[]): void {
    if (nodo !== null) {
      this.inOrder(nodo.izq, resultados);
      resultados.push(nodo.datos);
      this.inOrder(nodo.der, resultados);
    }
  }

  clear(): void {
    this.raiz = null;
  }
}
