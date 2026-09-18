import type { DailyReflection } from '../entities';
import type { ReflectionRepository } from '../repositories';
import { fechaISO, generarId } from '../utilidades';

/** Estados de ánimo del check-in. Se guardan como texto en `estadoAnimo`. */
export const ESTADOS_ANIMO = [
  { valor: 'TRANQUILO', etiqueta: 'Tranquilo', icono: '🌿' },
  { valor: 'CONTENTO', etiqueta: 'Contento', icono: '☀️' },
  { valor: 'CANSADO', etiqueta: 'Cansado', icono: '🌙' },
  { valor: 'ANSIOSO', etiqueta: 'Ansioso', icono: '🌊' },
  { valor: 'TRISTE', etiqueta: 'Bajoneado', icono: '🌧️' },
] as const;

/**
 * Guarda la reflexión diaria (opcional) en `reflexionesDiarias`.
 * Corresponde a `RegistrarReflexionDiaria` del diagrama de clases.
 * Si ya había una reflexión de hoy, se reemplaza en lugar de duplicarla.
 */
export class RegistrarReflexionDiaria {
  constructor(private readonly reflectionRepository: ReflectionRepository) {}

  async ejecutar(
    uid: string,
    contenido: string,
    estadoAnimo: string,
    reflexionExistente?: DailyReflection | null,
  ): Promise<DailyReflection> {
    const reflexion: DailyReflection = {
      reflexionId: reflexionExistente?.reflexionId ?? generarId(),
      userId: uid,
      fecha: reflexionExistente?.fecha ?? fechaISO(),
      contenido: contenido.trim(),
      estadoAnimo,
      timestamp: new Date(),
    };
    await this.reflectionRepository.guardarReflexion(reflexion);
    return reflexion;
  }
}
