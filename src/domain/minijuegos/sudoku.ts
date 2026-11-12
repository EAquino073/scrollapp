import type { Sudoku } from '../entities';
import { barajar, indiceAleatorio, type Aleatorio } from '../utilidades';

/** Celdas vacías que se intentan dejar: el reto debe caber con calma en unos 3 minutos. */
const VACIAS_OBJETIVO: Record<4 | 6, number> = { 4: 9, 6: 16 };

type Tablero = (number | null)[][];

function dimensiones(tamano: 4 | 6) {
  return { filasBloque: 2, columnasBloque: tamano === 4 ? 2 : 3 };
}

/**
 * Tablero base válido por fórmula: cada fila es un desplazamiento cíclico de la anterior,
 * elegido para que filas, columnas y recuadros tengan todos los números.
 */
function tableroBase(tamano: number, filasBloque: number, columnasBloque: number): number[][] {
  return Array.from({ length: tamano }, (_, f) =>
    Array.from({ length: tamano }, (__, c) =>
      ((columnasBloque * (f % filasBloque) + Math.floor(f / filasBloque) + c) % tamano) + 1,
    ),
  );
}

/** Orden de índices que permuta grupos y, dentro de cada grupo, sus elementos. */
function ordenPorGrupos(grupos: number, porGrupo: number, aleatorio: Aleatorio): number[] {
  const ordenGrupos = barajar(
    Array.from({ length: grupos }, (_, i) => i),
    aleatorio,
  );
  return ordenGrupos.flatMap(g =>
    barajar(
      Array.from({ length: porGrupo }, (_, i) => g * porGrupo + i),
      aleatorio,
    ),
  );
}

/**
 * Solución al azar a partir de la base, con transformaciones que conservan la validez:
 * renombrar números, permutar bandas de filas y filas dentro de cada banda, permutar
 * columnas de recuadros y columnas dentro de cada una, y transponer si los recuadros son
 * cuadrados.
 */
function solucionAleatoria(tamano: 4 | 6, aleatorio: Aleatorio): number[][] {
  const { filasBloque, columnasBloque } = dimensiones(tamano);
  const base = tableroBase(tamano, filasBloque, columnasBloque);
  const numeros = barajar(
    Array.from({ length: tamano }, (_, i) => i + 1),
    aleatorio,
  );
  const filas = ordenPorGrupos(tamano / filasBloque, filasBloque, aleatorio);
  const columnas = ordenPorGrupos(tamano / columnasBloque, columnasBloque, aleatorio);
  let tablero = filas.map(f => columnas.map(c => numeros[base[f][c] - 1]));
  if (filasBloque === columnasBloque && indiceAleatorio(2, aleatorio) === 1) {
    tablero = tablero.map((fila, f) => fila.map((_, c) => tablero[c][f]));
  }
  return tablero;
}

function puedeIr(t: Tablero, f: number, c: number, n: number, filasBloque: number, columnasBloque: number): boolean {
  const tamano = t.length;
  for (let i = 0; i < tamano; i++) {
    if (t[f][i] === n || t[i][c] === n) {
      return false;
    }
  }
  const f0 = f - (f % filasBloque);
  const c0 = c - (c % columnasBloque);
  for (let i = f0; i < f0 + filasBloque; i++) {
    for (let j = c0; j < c0 + columnasBloque; j++) {
      if (t[i][j] === n) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Cuenta soluciones hasta `limite` con retroceso, eligiendo siempre la celda vacía con
 * menos candidatos. Con `limite = 2` basta para saber si la solución es única.
 */
export function contarSoluciones(inicial: Tablero, filasBloque: number, columnasBloque: number, limite = 2): number {
  const t = inicial.map(fila => [...fila]);
  const tamano = t.length;
  let encontradas = 0;

  const resolver = (): void => {
    let mejor: { f: number; c: number; candidatos: number[] } | null = null;
    for (let f = 0; f < tamano && (!mejor || mejor.candidatos.length > 1); f++) {
      for (let c = 0; c < tamano; c++) {
        if (t[f][c] !== null) {
          continue;
        }
        const candidatos: number[] = [];
        for (let n = 1; n <= tamano; n++) {
          if (puedeIr(t, f, c, n, filasBloque, columnasBloque)) {
            candidatos.push(n);
          }
        }
        if (!mejor || candidatos.length < mejor.candidatos.length) {
          mejor = { f, c, candidatos };
        }
      }
    }
    if (!mejor) {
      encontradas++;
      return;
    }
    for (const n of mejor.candidatos) {
      t[mejor.f][mejor.c] = n;
      resolver();
      t[mejor.f][mejor.c] = null;
      if (encontradas >= limite) {
        return;
      }
    }
  };

  resolver();
  return encontradas;
}

/**
 * Genera un sudoku de 4x4 o 6x6 con solución única: parte de una solución al azar y
 * retira celdas en orden aleatorio, devolviendo cada una que rompería la unicidad.
 */
export function generarSudoku(tamano: 4 | 6, aleatorio: Aleatorio): Sudoku {
  const { filasBloque, columnasBloque } = dimensiones(tamano);
  const solucion = solucionAleatoria(tamano, aleatorio);
  const inicial: Tablero = solucion.map(fila => [...fila]);
  const celdas = barajar(
    Array.from({ length: tamano * tamano }, (_, i) => ({ f: Math.floor(i / tamano), c: i % tamano })),
    aleatorio,
  );
  let vacias = 0;
  for (const { f, c } of celdas) {
    if (vacias >= VACIAS_OBJETIVO[tamano]) {
      break;
    }
    const valor = inicial[f][c];
    inicial[f][c] = null;
    if (contarSoluciones(inicial, filasBloque, columnasBloque) === 1) {
      vacias++;
    } else {
      inicial[f][c] = valor;
    }
  }
  return { tamano, filasBloque, columnasBloque, solucion, inicial };
}

/**
 * Celdas que repiten número en su fila, columna o recuadro. La interfaz las resalta con
 * suavidad (no como error): es solo una ayuda para ver dónde mirar.
 */
export function conflictosSudoku(tablero: Tablero, filasBloque: number, columnasBloque: number): boolean[][] {
  const tamano = tablero.length;
  const conflicto = tablero.map(fila => fila.map(() => false));
  for (let f = 0; f < tamano; f++) {
    for (let c = 0; c < tamano; c++) {
      const n = tablero[f][c];
      if (n === null) {
        continue;
      }
      for (let i = 0; i < tamano; i++) {
        const otraEnFila = i !== c && tablero[f][i] === n;
        const otraEnColumna = i !== f && tablero[i][c] === n;
        const fb = f - (f % filasBloque) + Math.floor(i / columnasBloque);
        const cb = c - (c % columnasBloque) + (i % columnasBloque);
        const otraEnRecuadro = (fb !== f || cb !== c) && tablero[fb][cb] === n;
        if (otraEnFila || otraEnColumna || otraEnRecuadro) {
          conflicto[f][c] = true;
          break;
        }
      }
    }
  }
  return conflicto;
}

/** Resuelto: todas las celdas llenas y ningún número repetido. */
export function sudokuResuelto(tablero: Tablero, filasBloque: number, columnasBloque: number): boolean {
  if (tablero.some(fila => fila.some(n => n === null))) {
    return false;
  }
  return !conflictosSudoku(tablero, filasBloque, columnasBloque).some(fila => fila.some(Boolean));
}
