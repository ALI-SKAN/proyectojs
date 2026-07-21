export interface Arista {
  destino: string;
  peso: number;
}

export class GrafoCampus {
  private adyacencia: Map<string, Arista[]> = new Map();

  adicionarVertice(v: string): void {
    if (!this.adyacencia.has(v)) {
      this.adyacencia.set(v, []);
    }
  }

  adicionarArista(v1: string, v2: string, peso: number): void {
    this.adicionarVertice(v1);
    this.adicionarVertice(v2);
    
    this.adyacencia.get(v1)!.push({ destino: v2, peso });
    this.adyacencia.get(v2)!.push({ destino: v1, peso }); // Grafo no dirigido
  }

  // Algoritmo de Dijkstra para encontrar la ruta más corta y su distancia
  obtenerRutaMasCorta(inicio: string, fin: string): { ruta: string[]; distancia: number } {
    const distancias: Map<string, number> = new Map();
    const previo: Map<string, string | null> = new Map();
    const visitados: Set<string> = new Set();
    const nodos: string[] = Array.from(this.adyacencia.keys());

    // Inicializar distancias
    for (const nodo of nodos) {
      distancias.set(nodo, Infinity);
      previo.set(nodo, null);
    }
    distancias.set(inicio, 0);

    while (visitados.size < nodos.length) {
      // Encontrar el nodo no visitado con la menor distancia
      let nodoActual: string | null = null;
      let distanciaMinima = Infinity;

      for (const nodo of nodos) {
        if (!visitados.has(nodo) && distancias.get(nodo)! < distanciaMinima) {
          nodoActual = nodo;
          distanciaMinima = distancias.get(nodo)!;
        }
      }

      if (nodoActual === null || distanciaMinima === Infinity) {
        break; // Todos los nodos alcanzables han sido procesados o fin es inalcanzable
      }

      if (nodoActual === fin) {
        break; // Hemos encontrado la ruta más corta hasta el destino
      }

      visitados.add(nodoActual);

      // Relajar aristas adyacentes
      const vecinos = this.adyacencia.get(nodoActual) || [];
      for (const vecino of vecinos) {
        if (!visitados.has(vecino.destino)) {
          const nuevaDistancia = distancias.get(nodoActual)! + vecino.peso;
          if (nuevaDistancia < distancias.get(vecino.destino)!) {
            distancias.set(vecino.destino, nuevaDistancia);
            previo.set(vecino.destino, nodoActual);
          }
        }
      }
    }

    // Reconstruir la ruta
    const ruta: string[] = [];
    let actual: string | null = fin;
    while (actual !== null) {
      ruta.unshift(actual);
      actual = previo.get(actual) || null;
    }

    return {
      ruta: ruta[0] === inicio ? ruta : [],
      distancia: distancias.get(fin) === Infinity ? 0 : distancias.get(fin)!
    };
  }

  getVertices(): string[] {
    return Array.from(this.adyacencia.keys());
  }

  getMapaCompleto(): any {
    const mapa: any = {};
    for (const [key, value] of this.adyacencia.entries()) {
      mapa[key] = value;
    }
    return mapa;
  }
}

// Instanciar y configurar el grafo del campus
export const campusGraph = new GrafoCampus();

// Añadir vértices (ubicaciones de oficinas de soporte y campus)
campusGraph.adicionarVertice('Ingreso Principal');
campusGraph.adicionarVertice('Plaza Central');
campusGraph.adicionarVertice('Pabellón A (Secretaría)');      // Oficina para Administrativa
campusGraph.adicionarVertice('Pabellón B (Bienestar)');      // Oficina para Académica
campusGraph.adicionarVertice('Pabellón C (Sistemas)');       // Oficina para Técnica
campusGraph.adicionarVertice('Oficina Central (Informes)');  // Oficina para General
campusGraph.adicionarVertice('Biblioteca');
campusGraph.adicionarVertice('Cafetería Central');

// Añadir aristas con distancias reales en metros
campusGraph.adicionarArista('Ingreso Principal', 'Plaza Central', 120);
campusGraph.adicionarArista('Plaza Central', 'Oficina Central (Informes)', 30);
campusGraph.adicionarArista('Plaza Central', 'Pabellón A (Secretaría)', 70);
campusGraph.adicionarArista('Plaza Central', 'Pabellón B (Bienestar)', 90);
campusGraph.adicionarArista('Plaza Central', 'Biblioteca', 80);
campusGraph.adicionarArista('Biblioteca', 'Pabellón C (Sistemas)', 50);
campusGraph.adicionarArista('Pabellón A (Secretaría)', 'Cafetería Central', 60);
campusGraph.adicionarArista('Pabellón B (Bienestar)', 'Cafetería Central', 40);
campusGraph.adicionarArista('Pabellón C (Sistemas)', 'Pabellón B (Bienestar)', 100);
