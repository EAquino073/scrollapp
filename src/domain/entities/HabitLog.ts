/**
 * Registro de cumplimiento (o no) de un hábito sustituto en un día.
 * Colección: `registrosHabitos`. `fecha` en formato ISO `YYYY-MM-DD`.
 *
 * `contenidoId` es una extensión al diagrama (fase 5): el ID del contenido guiado que
 * se mostró (`leer-012`, `reto-044`, `juego-laberinto`…), para el análisis del estudio.
 * Es `null` en los hábitos propios del usuario (solo temporizador) y en los registros
 * anteriores a la fase 5.
 */
export interface HabitLog {
  logId: string;
  habitId: string;
  userId: string;
  fecha: string;
  cumplido: boolean;
  timestamp: Date;
  contenidoId: string | null;
}
