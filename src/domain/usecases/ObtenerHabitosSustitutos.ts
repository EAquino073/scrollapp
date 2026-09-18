import type { ReplacementHabit } from '../entities';
import type { HabitRepository } from '../repositories';

/** Lista los hábitos sustitutos del participante (activos, o todos si se pide). */
export class ObtenerHabitosSustitutos {
  constructor(private readonly habitRepository: HabitRepository) {}

  ejecutar(uid: string, incluirInactivos = false): Promise<ReplacementHabit[]> {
    return incluirInactivos
      ? this.habitRepository.obtenerTodosLosHabitos(uid)
      : this.habitRepository.obtenerHabitosActivos(uid);
  }
}
