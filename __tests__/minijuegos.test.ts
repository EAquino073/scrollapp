/* eslint-disable no-bitwise -- mulberry32 necesita operaciones de bits */
import type { WaterSort } from '../src/domain/entities/Minijuego';
import {
  avanzarHacia,
  celdasAlcanzables,
  contarSoluciones,
  conflictosSudoku,
  generarLaberinto,
  generarMinijuego,
  generarSudoku,
  generarWaterSort,
  hayPaso,
  sudokuResuelto,
  tamanoLaberintoParaGama,
  verter,
  waterSortResuelto,
} from '../src/domain/minijuegos';

function semilla(valor: number): () => number {
  let a = valor >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEMILLAS = Array.from({ length: 150 }, (_, i) => i + 1);

describe('laberinto', () => {
  it('ajusta el tamaño a la gama', () => {
    expect(tamanoLaberintoParaGama('BAJA')).toBe(6);
    expect(tamanoLaberintoParaGama('MEDIA')).toBe(7);
    expect(tamanoLaberintoParaGama('ALTA')).toBe(8);
    expect(tamanoLaberintoParaGama('')).toBe(7);
  });

  it.each([6, 7, 8])('genera laberintos perfectos de lado %i', tamano => {
    for (const s of SEMILLAS) {
      const lab = generarLaberinto(tamano, semilla(s));
      expect(celdasAlcanzables(lab)).toBe(tamano * tamano);
      let pasosAbiertos = 0;
      for (let f = 0; f < tamano; f++) {
        for (let c = 0; c < tamano; c++) {
          const p = lab.pasos[f][c];
          // Las paredes son simétricas y el borde está cerrado.
          if (c + 1 < tamano) {
            expect(p.este).toBe(lab.pasos[f][c + 1].oeste);
          } else {
            expect(p.este).toBe(false);
          }
          if (f + 1 < tamano) {
            expect(p.sur).toBe(lab.pasos[f + 1][c].norte);
          } else {
            expect(p.sur).toBe(false);
          }
          pasosAbiertos += Number(p.este) + Number(p.sur);
        }
      }
      // Árbol de expansión: exactamente n² - 1 pasos, así que hay un único camino.
      expect(pasosAbiertos).toBe(tamano * tamano - 1);
    }
  });

  it('avanza por pasillos, se detiene en paredes y deshace al volver', () => {
    const lab = generarLaberinto(6, semilla(42));
    const inicio = [lab.inicio];
    // Un destino no alineado no mueve nada.
    expect(avanzarHacia(lab, inicio, { fila: 3, columna: 3 })).toBe(inicio);
    const vecinas = [
      { fila: 0, columna: 1 },
      { fila: 1, columna: 0 },
    ];
    const abierta = vecinas.find(v => hayPaso(lab, lab.inicio, v));
    expect(abierta).toBeDefined();
    const avanzado = avanzarHacia(lab, inicio, abierta!);
    expect(avanzado).toHaveLength(2);
    const devuelto = avanzarHacia(lab, avanzado, lab.inicio);
    expect(devuelto).toEqual(inicio);
    const cerrada = vecinas.find(v => !hayPaso(lab, lab.inicio, v));
    if (cerrada) {
      expect(avanzarHacia(lab, inicio, cerrada)).toBe(inicio);
    }
  });
});

describe('sudoku', () => {
  it.each([4, 6] as const)('genera sudokus de lado %i con solución única', tamano => {
    const vacias: number[] = [];
    for (const s of SEMILLAS) {
      const sudoku = generarSudoku(tamano, semilla(s));
      const { filasBloque, columnasBloque, solucion, inicial } = sudoku;
      expect(sudokuResuelto(solucion, filasBloque, columnasBloque)).toBe(true);
      inicial.forEach((fila, f) =>
        fila.forEach((n, c) => {
          if (n !== null) {
            expect(n).toBe(solucion[f][c]);
          }
        }),
      );
      expect(contarSoluciones(inicial, filasBloque, columnasBloque)).toBe(1);
      vacias.push(inicial.flat().filter(n => n === null).length);
    }
    const minimo = tamano === 4 ? 8 : 12;
    expect(Math.min(...vacias)).toBeGreaterThanOrEqual(minimo);
  });

  it('las soluciones varían', () => {
    const a = generarSudoku(6, semilla(1)).solucion.flat().join('');
    const b = generarSudoku(6, semilla(2)).solucion.flat().join('');
    expect(a).not.toBe(b);
  });

  it('marca conflictos en fila, columna y recuadro', () => {
    const tablero = [
      [1, null, null, 1],
      [null, 1, null, null],
      [null, null, null, null],
      [1, null, null, null],
    ];
    const c = conflictosSudoku(tablero, 2, 2);
    expect(c[0][0]).toBe(true);
    expect(c[0][3]).toBe(true);
    expect(c[1][1]).toBe(true);
    expect(c[3][0]).toBe(true);
    expect(c[2][2]).toBe(false);
  });
});

/** Movimientos mínimos para resolver (búsqueda en anchura), o -1 si no tiene solución. */
function movimientosMinimos(inicial: WaterSort, limite = 300000): number {
  const clave = (e: WaterSort) => e.botellas.map(b => b.join('')).sort().join('|');
  const vistos = new Set([clave(inicial)]);
  let frontera = [inicial];
  for (let profundidad = 0; frontera.length > 0; profundidad++) {
    const siguiente: WaterSort[] = [];
    for (const estado of frontera) {
      if (waterSortResuelto(estado)) {
        return profundidad;
      }
      for (let i = 0; i < estado.botellas.length; i++) {
        for (let j = 0; j < estado.botellas.length; j++) {
          const nuevo = verter(estado, i, j);
          if (nuevo) {
            const k = clave(nuevo);
            if (!vistos.has(k)) {
              vistos.add(k);
              siguiente.push(nuevo);
            }
          }
        }
      }
      if (vistos.size > limite) {
        throw new Error('Demasiados estados');
      }
    }
    frontera = siguiente;
  }
  return -1;
}

describe('water sort', () => {
  it.each([3, 4] as const)('con %i colores siempre tiene solución y empieza mezclado', colores => {
    const pasos: number[] = [];
    for (const s of SEMILLAS) {
      const estado = generarWaterSort(colores, semilla(s));
      expect(estado.botellas).toHaveLength(colores + 1);
      for (let color = 0; color < colores; color++) {
        expect(estado.botellas.flat().filter(x => x === color)).toHaveLength(estado.capacidad);
      }
      expect(estado.botellas.every(b => b.length <= estado.capacidad)).toBe(true);
      expect(waterSortResuelto(estado)).toBe(false);
      expect(
        estado.botellas.some(b => b.length === estado.capacidad && b.every(x => x === b[0])),
      ).toBe(false);
      const minimo = movimientosMinimos(estado);
      expect(minimo).toBeGreaterThan(0);
      pasos.push(minimo);
    }
    // Ni triviales ni eternos: registro de referencia para calibrar la dificultad.
    console.log(
      `water sort ${colores} colores: mínimo de movimientos entre ${Math.min(...pasos)} y ${Math.max(...pasos)}, ` +
        `promedio ${(pasos.reduce((a, b) => a + b, 0) / pasos.length).toFixed(1)}`,
    );
    expect(Math.min(...pasos)).toBeGreaterThanOrEqual(3);
  });

  it('respeta la regla de vertido', () => {
    const estado: WaterSort = { capacidad: 4, colores: 2, botellas: [[0, 1, 1], [1], [0], []] };
    expect(verter(estado, 0, 2)).toBeNull();
    expect(verter(estado, 0, 0)).toBeNull();
    expect(verter(estado, 3, 0)).toBeNull();
    expect(verter(estado, 0, 1)?.botellas).toEqual([[0], [1, 1, 1], [0], []]);
    expect(verter(estado, 0, 3)?.botellas).toEqual([[0], [1], [0], [1, 1]]);
  });
});

describe('generarMinijuego', () => {
  it('genera los tres tipos', () => {
    expect(generarMinijuego('LABERINTO', 'BAJA', semilla(1))).toMatchObject({ juego: 'LABERINTO', laberinto: { tamano: 6 } });
    expect(generarMinijuego('SUDOKU', 'ALTA', semilla(1)).juego).toBe('SUDOKU');
    expect(generarMinijuego('WATER_SORT', 'MEDIA', semilla(1)).juego).toBe('WATER_SORT');
  });
});
