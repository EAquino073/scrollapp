import React from 'react';
import type { MinijuegoGenerado, TipoMinijuego } from '../../../domain/entities';
import { JuegoLaberinto } from './JuegoLaberinto';
import { JuegoSudoku } from './JuegoSudoku';
import { JuegoWaterSort } from './JuegoWaterSort';

/** Indicación breve de cada minijuego (se muestra una vez, arriba del tablero). */
export const INSTRUCCIONES_MINIJUEGO: Record<TipoMinijuego, string> = {
  LABERINTO: 'Lleva el punto hasta el círculo ámbar. Puedes arrastrar el dedo o tocar las casillas vecinas.',
  SUDOKU: 'Cada número va una sola vez en cada fila, columna y recuadro. Toca una casilla y elige un número.',
  WATER_SORT:
    'Deja cada botella de un solo color. Toca una botella y luego otra para verter: el color cae sobre su mismo color o en una botella vacía.',
};

interface Props {
  minijuego: MinijuegoGenerado;
  /** Debe ser estable (useCallback) para no redibujar el tablero con cada segundo. */
  onResuelto(): void;
}

export function VistaMinijuego({ minijuego, onResuelto }: Props) {
  switch (minijuego.juego) {
    case 'LABERINTO':
      return <JuegoLaberinto laberinto={minijuego.laberinto} onResuelto={onResuelto} />;
    case 'SUDOKU':
      return <JuegoSudoku sudoku={minijuego.sudoku} onResuelto={onResuelto} />;
    case 'WATER_SORT':
      return <JuegoWaterSort waterSort={minijuego.waterSort} onResuelto={onResuelto} />;
  }
}
