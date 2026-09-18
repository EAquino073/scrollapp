import type { AppSession } from '../entities';

/** Sesiones de uso de la propia app (frecuencia de interacción). */
export interface SessionRepository {
  registrarSesion(sesion: AppSession): Promise<void>;
  /** Extensión al diagrama: necesaria para contar sesiones en `WeeklyStats`. */
  obtenerSesiones(uid: string): Promise<AppSession[]>;
}
