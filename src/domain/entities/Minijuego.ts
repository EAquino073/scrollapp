/**
 * Minijuegos tranquilos de la actividad «Un reto para la mente» (fase 5). Se alternan con
 * los acertijos del banco. Principios: un solo puzzle por sesión, sin puntaje, sin niveles,
 * sin «siguiente», sin temporizador visible, sin sonidos. Se resuelve y termina; «Saltar»
 * aparece al minuto. Todos se generan por algoritmo en el dispositivo.
 */
export const TIPOS_MINIJUEGO = ['LABERINTO', 'SUDOKU', 'WATER_SORT'] as const;
export type TipoMinijuego = (typeof TIPOS_MINIJUEGO)[number];

/** Valor de `HabitLog.contenidoId` para cada minijuego. */
export const CONTENIDO_ID_MINIJUEGO: Record<TipoMinijuego, string> = {
  LABERINTO: 'juego-laberinto',
  SUDOKU: 'juego-sudoku',
  WATER_SORT: 'juego-watersort',
};

export const NOMBRE_MINIJUEGO: Record<TipoMinijuego, string> = {
  LABERINTO: 'el laberinto',
  SUDOKU: 'el sudoku',
  WATER_SORT: 'los colores',
};

/** Segundos que deben pasar antes de ofrecer «Saltar». */
export const SEGUNDOS_PARA_SALTAR = 60;

export interface Celda {
  fila: number;
  columna: number;
}

export type Direccion = 'norte' | 'este' | 'sur' | 'oeste';

/** Pasos abiertos de una celda del laberinto: donde es `false`, hay pared. */
export type PasosCelda = Record<Direccion, boolean>;

/** Laberinto perfecto (un único camino entre dos celdas cualesquiera). */
export interface Laberinto {
  tamano: number;
  /** `pasos[fila][columna]`. */
  pasos: PasosCelda[][];
  inicio: Celda;
  meta: Celda;
}

/** Sudoku de 4x4 (bloques 2x2) o 6x6 (bloques de 2 filas por 3 columnas). */
export interface Sudoku {
  tamano: 4 | 6;
  filasBloque: number;
  columnasBloque: number;
  /** Solución completa (valores de 1 a `tamano`). */
  solucion: number[][];
  /** Tablero inicial: número dado o `null` si la celda está vacía. */
  inicial: (number | null)[][];
}

/** Water sort: botellas con capas de color (índices), de abajo hacia arriba. */
export interface WaterSort {
  capacidad: number;
  colores: number;
  botellas: number[][];
}

/** Minijuego ya generado, listo para jugarse. */
export type MinijuegoGenerado =
  | { juego: 'LABERINTO'; laberinto: Laberinto }
  | { juego: 'SUDOKU'; sudoku: Sudoku }
  | { juego: 'WATER_SORT'; waterSort: WaterSort };
