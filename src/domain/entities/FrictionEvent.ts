import type { DecisionFriccion } from './DecisionFriccion';

/**
 * Evento generado cada vez que se muestra la pausa de fricción y el
 * usuario decide continuar o sustituir. Colección: `eventosFriccion`.
 * `habitId` solo se llena cuando la decisión es SUSTITUIR.
 */
export interface FrictionEvent {
  eventId: string;
  userId: string;
  redSocial: string;
  decision: DecisionFriccion;
  habitId: string | null;
  timestamp: Date;
}
