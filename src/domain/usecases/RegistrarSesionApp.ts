import type { AppSession } from '../entities';
import type { SessionRepository } from '../repositories';
import { generarId } from '../utilidades';

/**
 * Registra en `sesionesApp` cada vez que el participante abre la app, y actualiza la
 * duración cuando la deja. Alimenta el indicador de frecuencia de interacción del estudio
 * y el campo `sesionesApp` de `WeeklyStats`.
 */
export class RegistrarSesionApp {
  private sesionAbierta: AppSession | null = null;

  constructor(private readonly sessionRepository: SessionRepository) {}

  /** Abre una sesión. Si ya había una abierta, la cierra antes. */
  async abrir(uid: string): Promise<void> {
    if (this.sesionAbierta) {
      await this.cerrar();
    }
    const sesion: AppSession = {
      sessionId: generarId(),
      userId: uid,
      aperturaApp: new Date(),
      duracionSeg: 0,
    };
    this.sesionAbierta = sesion;
    try {
      await this.sessionRepository.registrarSesion(sesion);
    } catch (e) {
      console.warn('[ScrollApp] No se pudo registrar la sesión', e);
      this.sesionAbierta = null;
    }
  }

  /** Cierra la sesión abierta guardando su duración. */
  async cerrar(): Promise<void> {
    const sesion = this.sesionAbierta;
    if (!sesion) {
      return;
    }
    this.sesionAbierta = null;
    const duracionSeg = Math.max(0, Math.round((Date.now() - sesion.aperturaApp.getTime()) / 1000));
    try {
      await this.sessionRepository.registrarSesion({ ...sesion, duracionSeg });
    } catch (e) {
      console.warn('[ScrollApp] No se pudo cerrar la sesión', e);
    }
  }
}
