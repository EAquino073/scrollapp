import type { MinijuegoGenerado, TipoMinijuego } from '../entities';
import { indiceAleatorio, type Aleatorio } from '../utilidades';
import { generarLaberinto, tamanoLaberintoParaGama } from './laberinto';
import { generarSudoku } from './sudoku';
import { generarWaterSort } from './waterSort';

export * from './laberinto';
export * from './sudoku';
export * from './waterSort';

/**
 * Genera el puzzle de un minijuego. El laberinto se ajusta a la gama del dispositivo
 * (6x6 baja, 7x7 media, 8x8 alta); el sudoku sale de 4x4 o 6x6 y el water sort de 3 o 4
 * colores, al azar.
 */
export function generarMinijuego(
  juego: TipoMinijuego,
  gamaDispositivo: string | null | undefined,
  aleatorio: Aleatorio,
): MinijuegoGenerado {
  switch (juego) {
    case 'LABERINTO':
      return { juego, laberinto: generarLaberinto(tamanoLaberintoParaGama(gamaDispositivo), aleatorio) };
    case 'SUDOKU':
      return { juego, sudoku: generarSudoku(indiceAleatorio(2, aleatorio) === 0 ? 4 : 6, aleatorio) };
    case 'WATER_SORT':
      return { juego, waterSort: generarWaterSort(indiceAleatorio(2, aleatorio) === 0 ? 3 : 4, aleatorio) };
  }
}
