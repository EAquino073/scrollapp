import type { DailyReflection } from '../entities';

/** Reflexiones diarias opcionales del check-in nocturno. */
export interface ReflectionRepository {
  guardarReflexion(reflexion: DailyReflection): Promise<void>;
  obtenerReflexiones(uid: string): Promise<DailyReflection[]>;
}
