import type { Celda, Direccion, Laberinto, PasosCelda } from '../entities';
import { barajar, type Aleatorio } from '../utilidades';

const DIRECCIONES: { direccion: Direccion; opuesta: Direccion; df: number; dc: number }[] = [
  { direccion: 'norte', opuesta: 'sur', df: -1, dc: 0 },
  { direccion: 'este', opuesta: 'oeste', df: 0, dc: 1 },
  { direccion: 'sur', opuesta: 'norte', df: 1, dc: 0 },
  { direccion: 'oeste', opuesta: 'este', df: 0, dc: -1 },
];

/** Tamaño de la cuadrícula según la gama del dispositivo: 6x6, 7x7 u 8x8. */
export function tamanoLaberintoParaGama(gama: string | null | undefined): number {
  if (gama === 'BAJA') {
    return 6;
  }
  if (gama === 'ALTA') {
    return 8;
  }
  return 7;
}

/**
 * Genera un laberinto perfecto con búsqueda en profundidad con retroceso: desde el inicio
 * se avanza a un vecino no visitado al azar abriendo la pared entre ambos y, cuando no
 * quedan vecinos libres, se retrocede. Todas las celdas quedan conectadas y hay un único
 * camino entre el inicio (arriba a la izquierda) y la meta (abajo a la derecha).
 */
export function generarLaberinto(tamano: number, aleatorio: Aleatorio): Laberinto {
  const pasos: PasosCelda[][] = Array.from({ length: tamano }, () =>
    Array.from({ length: tamano }, () => ({ norte: false, este: false, sur: false, oeste: false })),
  );
  const visitado = Array.from({ length: tamano }, () => Array<boolean>(tamano).fill(false));
  const pila: Celda[] = [{ fila: 0, columna: 0 }];
  visitado[0][0] = true;

  while (pila.length > 0) {
    const actual = pila[pila.length - 1];
    const libres = barajar(DIRECCIONES, aleatorio).filter(d => {
      const f = actual.fila + d.df;
      const c = actual.columna + d.dc;
      return f >= 0 && f < tamano && c >= 0 && c < tamano && !visitado[f][c];
    });
    if (libres.length === 0) {
      pila.pop();
      continue;
    }
    const d = libres[0];
    const siguiente = { fila: actual.fila + d.df, columna: actual.columna + d.dc };
    pasos[actual.fila][actual.columna][d.direccion] = true;
    pasos[siguiente.fila][siguiente.columna][d.opuesta] = true;
    visitado[siguiente.fila][siguiente.columna] = true;
    pila.push(siguiente);
  }

  return { tamano, pasos, inicio: { fila: 0, columna: 0 }, meta: { fila: tamano - 1, columna: tamano - 1 } };
}

export function mismaCelda(a: Celda, b: Celda): boolean {
  return a.fila === b.fila && a.columna === b.columna;
}

/** `true` si `hacia` es vecina de `desde` y no hay pared entre ambas. */
export function hayPaso(laberinto: Laberinto, desde: Celda, hacia: Celda): boolean {
  const d = DIRECCIONES.find(x => x.df === hacia.fila - desde.fila && x.dc === hacia.columna - desde.columna);
  return d !== undefined && laberinto.pasos[desde.fila][desde.columna][d.direccion];
}

/**
 * Avanza el recorrido hacia `destino`, celda por celda, si está en la misma fila o columna
 * que la posición actual (así un arrastre rápido por un pasillo no se pierde). Volver a la
 * celda anterior deshace el último paso. Se detiene en la primera pared.
 * Devuelve el recorrido nuevo (el mismo arreglo si no hubo movimiento).
 */
export function avanzarHacia(laberinto: Laberinto, recorrido: Celda[], destino: Celda): Celda[] {
  let camino = recorrido;
  let actual = camino[camino.length - 1];
  const mismaFila = actual.fila === destino.fila;
  const mismaColumna = actual.columna === destino.columna;
  if (mismaCelda(actual, destino) || (!mismaFila && !mismaColumna)) {
    return recorrido;
  }
  const df = Math.sign(destino.fila - actual.fila);
  const dc = Math.sign(destino.columna - actual.columna);
  while (!mismaCelda(actual, destino)) {
    const siguiente = { fila: actual.fila + df, columna: actual.columna + dc };
    if (!hayPaso(laberinto, actual, siguiente)) {
      break;
    }
    const anterior = camino.length > 1 ? camino[camino.length - 2] : null;
    camino = anterior && mismaCelda(anterior, siguiente) ? camino.slice(0, -1) : [...camino, siguiente];
    actual = siguiente;
  }
  return camino;
}

/** Número de celdas alcanzables desde el inicio (para verificar el generador). */
export function celdasAlcanzables(laberinto: Laberinto): number {
  const vistos = new Set<string>();
  const cola: Celda[] = [laberinto.inicio];
  vistos.add(`${laberinto.inicio.fila},${laberinto.inicio.columna}`);
  while (cola.length > 0) {
    const actual = cola.shift() as Celda;
    for (const d of DIRECCIONES) {
      const vecina = { fila: actual.fila + d.df, columna: actual.columna + d.dc };
      const clave = `${vecina.fila},${vecina.columna}`;
      if (!vistos.has(clave) && laberinto.pasos[actual.fila][actual.columna][d.direccion]) {
        vistos.add(clave);
        cola.push(vecina);
      }
    }
  }
  return vistos.size;
}
