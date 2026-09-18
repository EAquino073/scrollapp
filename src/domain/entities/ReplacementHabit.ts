import type { TipoActividad } from './ActividadPredeterminada';

/**
 * Micro-actividad de 2-3 minutos que el usuario elige como alternativa al scroll.
 * Colección: `habitosSustitutos`. El `habitId` es el ID del documento.
 *
 * `tipoActividad` es una extensión al diagrama ER: distingue una **actividad
 * predeterminada** del catálogo (tiene tipo, y en la fase 5 tendrá contenido guiado)
 * de un **hábito propio del usuario** (`null`, solo temporizador).
 */
export interface ReplacementHabit {
  habitId: string;
  userId: string;
  nombre: string;
  duracionMinutos: number;
  fechaCreacion: Date;
  activo: boolean;
  tipoActividad: TipoActividad | null;
}

/** `true` si el hábito viene del catálogo y podrá tener contenido guiado. */
export function esActividadPredeterminada(habito: ReplacementHabit): boolean {
  return habito.tipoActividad !== null;
}
