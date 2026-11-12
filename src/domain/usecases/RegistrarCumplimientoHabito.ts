import type { HabitLog } from '../entities';
import type { HabitRepository } from '../repositories';
import { fechaISO, generarId } from '../utilidades';

/**
 * Registra en `registrosHabitos` si el hábito sustituto se completó o no.
 * Un "no" también se guarda: sirve para entender el patrón, nunca para castigar.
 * `contenidoId` identifica el contenido guiado o minijuego mostrado (fase 5);
 * es `null` en los hábitos propios del usuario.
 */
export class RegistrarCumplimientoHabito {
  constructor(private readonly habitRepository: HabitRepository) {}

  async ejecutar(
    uid: string,
    habitId: string,
    cumplido: boolean,
    contenidoId: string | null = null,
  ): Promise<HabitLog> {
    const log: HabitLog = {
      logId: generarId(),
      habitId,
      userId: uid,
      fecha: fechaISO(),
      cumplido,
      timestamp: new Date(),
      contenidoId,
    };
    await this.habitRepository.registrarCumplimiento(log);
    return log;
  }
}
