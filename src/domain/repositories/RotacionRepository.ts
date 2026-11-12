import type { EstadoRotacion } from '../entities';

/**
 * Estado local de la rotación de contenido, por usuario y por clave (una actividad,
 * o el turno de minijuegos). Extensión del diagrama (fase 5). Vive en el dispositivo:
 * si se pierde, la rotación simplemente empieza una vuelta nueva.
 */
export interface RotacionRepository {
  obtenerEstado(uid: string, clave: string): Promise<EstadoRotacion | null>;
  guardarEstado(uid: string, clave: string, estado: EstadoRotacion): Promise<void>;
}
