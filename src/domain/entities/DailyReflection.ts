/**
 * Reflexión opcional del check-in nocturno.
 * Colección: `reflexionesDiarias`. `fecha` en formato ISO `YYYY-MM-DD`.
 */
export interface DailyReflection {
  reflexionId: string;
  userId: string;
  fecha: string;
  contenido: string;
  estadoAnimo: string;
  timestamp: Date;
}
