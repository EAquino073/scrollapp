import type { ReplacementHabit } from '../entities';
import type { HabitRepository } from '../repositories';

/**
 * Elige un hábito sustituto activo para ofrecer en la pausa de fricción.
 * Alterna entre los hábitos para no repetir siempre el mismo.
 */
export class SugerirHabitoSustituto {
  private ultimoSugerido: string | null = null;

  constructor(private readonly habitRepository: HabitRepository) {}

  async ejecutar(uid: string): Promise<ReplacementHabit | null> {
    const activos = await this.habitRepository.obtenerHabitosActivos(uid);
    if (activos.length === 0) {
      return null;
    }
    const candidatos =
      activos.length > 1 ? activos.filter(h => h.habitId !== this.ultimoSugerido) : activos;
    const elegido = candidatos[Math.floor(Math.random() * candidatos.length)];
    this.ultimoSugerido = elegido.habitId;
    return elegido;
  }
}
