/**
 * Registro de cumplimiento (o no) de un hábito sustituto en un día.
 * Colección: `registrosHabitos`. `fecha` en formato ISO `YYYY-MM-DD`.
 */
export interface HabitLog {
  logId: string;
  habitId: string;
  userId: string;
  fecha: string;
  cumplido: boolean;
  timestamp: Date;
}
