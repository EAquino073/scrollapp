import type { HabitLog } from '../entities';
import type { HabitRepository } from '../repositories';
import { fechaISO, generarId } from '../utilidades';

/**
 * Registra en `registrosHabitos` si el hábito sustituto se completó o no.
 * Un "no" también se guarda: sirve para entender el patrón, nunca para castigar.
 */
export class RegistrarCumplimientoHabito {
  constructor(private readonly habitRepository: HabitRepository) {}

  async ejecutar(uid: string, habitId: string, cumplido: boolean): Promise<HabitLog> {
    const log: HabitLog = {
      logId: generarId(),
      habitId,
      userId: uid,
      fecha: fechaISO(),
      cumplido,
      timestamp: new Date(),
    };
    await this.habitRepository.registrarCumplimiento(log);
    return log;
  }
}
