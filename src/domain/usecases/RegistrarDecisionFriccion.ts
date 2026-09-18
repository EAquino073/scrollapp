import { DecisionFriccion, type FrictionEvent } from '../entities';
import type { HabitRepository, ScrollRepository } from '../repositories';
import { generarId } from '../utilidades';

export interface DatosDecisionFriccion {
  uid: string;
  redSocial: string;
  decision: DecisionFriccion;
  /** Obligatorio cuando la decisión es SUSTITUIR. */
  habitId?: string | null;
}

/**
 * Registra en `eventosFriccion` la decisión tomada en la pausa: CONTINUAR o SUSTITUIR.
 * Si es SUSTITUIR, comprueba que el hábito elegido siga activo para el usuario.
 * Corresponde a `RegistrarDecisionFriccion` del diagrama de clases.
 */
export class RegistrarDecisionFriccion {
  constructor(
    private readonly scrollRepository: ScrollRepository,
    private readonly habitRepository: HabitRepository,
  ) {}

  async ejecutar(datos: DatosDecisionFriccion): Promise<FrictionEvent> {
    let habitId: string | null = null;

    if (datos.decision === DecisionFriccion.SUSTITUIR) {
      if (!datos.habitId) {
        throw new Error('Para sustituir hace falta un hábito');
      }
      const activos = await this.habitRepository.obtenerHabitosActivos(datos.uid);
      if (!activos.some(habito => habito.habitId === datos.habitId)) {
        throw new Error('El hábito elegido ya no está activo');
      }
      habitId = datos.habitId;
    }

    const evento: FrictionEvent = {
      eventId: generarId(),
      userId: datos.uid,
      redSocial: datos.redSocial,
      decision: datos.decision,
      habitId,
      timestamp: new Date(),
    };
    await this.scrollRepository.registrarEventoFriccion(evento);
    return evento;
  }
}
