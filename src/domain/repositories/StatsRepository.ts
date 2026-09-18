import type { WeeklyStats } from '../entities';

/** Estadísticas semanales por participante. */
export interface StatsRepository {
  calcularEstadisticasSemanales(uid: string, semana: number): Promise<WeeklyStats>;
  guardarEstadisticas(stats: WeeklyStats): Promise<void>;
  obtenerHistorial(uid: string): Promise<WeeklyStats[]>;
}
