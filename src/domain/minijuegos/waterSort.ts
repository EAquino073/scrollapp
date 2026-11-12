import type { WaterSort } from '../entities';
import { indiceAleatorio, type Aleatorio } from '../utilidades';

const CAPACIDAD = 4;
const PASOS_INVERSOS = 70;
const INTENTOS = 40;

function tope(botella: number[]): number | null {
  return botella.length > 0 ? botella[botella.length - 1] : null;
}

/** Cuántas capas seguidas del mismo color hay arriba de la botella. */
function rachaSuperior(botella: number[]): number {
  const color = tope(botella);
  let n = 0;
  for (let i = botella.length - 1; i >= 0 && botella[i] === color; i--) {
    n++;
  }
  return n;
}

function copiar(botellas: number[][]): number[][] {
  return botellas.map(b => [...b]);
}

/** Resuelto: cada botella está vacía o llena de un solo color. */
export function waterSortResuelto(estado: WaterSort): boolean {
  return estado.botellas.every(
    b => b.length === 0 || (b.length === estado.capacidad && b.every(color => color === b[0])),
  );
}

/**
 * Vierte de una botella a otra con la regla del juego: se mueve el bloque de color de
 * arriba (todo lo que quepa) sobre una botella vacía o cuyo color de arriba sea el mismo.
 * Devuelve el estado nuevo, o `null` si el movimiento no es válido.
 */
export function verter(estado: WaterSort, desde: number, hacia: number): WaterSort | null {
  const origen = estado.botellas[desde];
  const destino = estado.botellas[hacia];
  if (desde === hacia || !origen || !destino || origen.length === 0 || destino.length >= estado.capacidad) {
    return null;
  }
  const color = tope(origen);
  if (destino.length > 0 && tope(destino) !== color) {
    return null;
  }
  const cantidad = Math.min(rachaSuperior(origen), estado.capacidad - destino.length);
  const botellas = copiar(estado.botellas);
  botellas[desde] = origen.slice(0, origen.length - cantidad);
  botellas[hacia] = [...destino, ...origen.slice(origen.length - cantidad)];
  return { ...estado, botellas };
}

interface MovimientoInverso {
  desde: number;
  hacia: number;
  cantidad: number;
}

/**
 * Movimientos «hacia atrás» que se pueden deshacer con un vertido válido. Tomar `k` capas
 * del color X de arriba de `desde` y ponerlas sobre `hacia` es reversible si:
 * - `hacia` está vacía o su color de arriba no es X (así, al verter de vuelta, se mueven
 *   exactamente esas `k` capas);
 * - después de quitarlas, `desde` queda vacía o sigue teniendo X arriba (para que el
 *   vertido de vuelta caiga sobre el mismo color).
 */
function movimientosInversos(botellas: number[][], capacidad: number): MovimientoInverso[] {
  const movimientos: MovimientoInverso[] = [];
  botellas.forEach((origen, desde) => {
    if (origen.length === 0) {
      return;
    }
    const color = tope(origen);
    const racha = rachaSuperior(origen);
    botellas.forEach((destino, hacia) => {
      if (hacia === desde || destino.length >= capacidad || tope(destino) === color) {
        return;
      }
      const maximo = Math.min(racha, capacidad - destino.length);
      for (let cantidad = 1; cantidad <= maximo; cantidad++) {
        const vaciaOIgual = cantidad < racha || cantidad === origen.length;
        if (vaciaOIgual) {
          movimientos.push({ desde, hacia, cantidad });
        }
      }
    });
  });
  return movimientos;
}

/** Cambios de color entre capas vecinas: una medida sencilla de qué tan mezclado está. */
function mezcla(botellas: number[][]): number {
  return botellas.reduce((suma, b) => suma + b.filter((color, i) => i > 0 && color !== b[i - 1]).length, 0);
}

function hayBotellaCompleta(botellas: number[][], capacidad: number): boolean {
  return botellas.some(b => b.length === capacidad && b.every(color => color === b[0]));
}

/**
 * Genera un water sort de `colores` colores (3 o 4) con una botella vacía extra. Parte del
 * estado resuelto y aplica movimientos hacia atrás al azar; como cada uno se puede deshacer
 * con un vertido válido, el puzzle siempre tiene solución. Se repite hasta que quede bien
 * mezclado y sin ninguna botella ya terminada.
 */
export function generarWaterSort(colores: 3 | 4, aleatorio: Aleatorio): WaterSort {
  const resuelto = [
    ...Array.from({ length: colores }, (_, color) => Array<number>(CAPACIDAD).fill(color)),
    [],
  ];
  const mezclaMinima = colores * 2;
  let mejor = copiar(resuelto);

  for (let intento = 0; intento < INTENTOS; intento++) {
    let botellas = copiar(resuelto);
    let anterior: MovimientoInverso | null = null;
    for (let paso = 0; paso < PASOS_INVERSOS; paso++) {
      // Evita deshacer justo el paso anterior, que no mezclaría nada.
      const opciones = movimientosInversos(botellas, CAPACIDAD).filter(
        m => !(anterior && m.desde === anterior.hacia && m.hacia === anterior.desde),
      );
      if (opciones.length === 0) {
        break;
      }
      const m = opciones[indiceAleatorio(opciones.length, aleatorio)];
      const capas = botellas[m.desde].slice(botellas[m.desde].length - m.cantidad);
      botellas = copiar(botellas);
      botellas[m.desde] = botellas[m.desde].slice(0, botellas[m.desde].length - m.cantidad);
      botellas[m.hacia] = [...botellas[m.hacia], ...capas];
      anterior = m;
    }
    if (mezcla(botellas) > mezcla(mejor) && !hayBotellaCompleta(botellas, CAPACIDAD)) {
      mejor = botellas;
    }
    if (mezcla(mejor) >= mezclaMinima) {
      break;
    }
  }
  return { capacidad: CAPACIDAD, colores, botellas: mejor };
}
