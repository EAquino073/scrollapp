import type { HabitLog, ReplacementHabit } from '../entities';

/** Hábitos sustitutos y sus registros de cumplimiento. */
export interface HabitRepository {
  obtenerHabitosActivos(uid: string): Promise<ReplacementHabit[]>;
  guardarHabito(habito: ReplacementHabit): Promise<void>;
  registrarCumplimiento(log: HabitLog): Promise<void>;
  obtenerLogsPorSemana(uid: string, semana: number): Promise<HabitLog[]>;
  /** Todos los hábitos, activos e inactivos (extensión del diagrama, para editarlos). */
  obtenerTodosLosHabitos(uid: string): Promise<ReplacementHabit[]>;
}
