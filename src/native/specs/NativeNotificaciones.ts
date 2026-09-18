import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Contrato del TurboModule `Notificaciones` (Kotlin, `android/.../notificaciones/`).
 * Recordatorios locales: no se guardan en Firestore ni salen del dispositivo.
 */
export interface Spec extends TurboModule {
  /** Programa (o reprograma) el recordatorio diario del check-in. */
  programarCheckInDiario(hora: number, minuto: number): void;
  cancelarCheckInDiario(): void;
  estaProgramadoCheckIn(): boolean;
  horaCheckIn(): number;
  minutoCheckIn(): number;
  /** Aviso inmediato de que la revisión semanal está lista. */
  mostrarAvisoRevisionSemanal(titulo: string, texto: string): void;
  /** Pantalla a abrir si la app se lanzó desde una notificación (se consume al leerla). */
  obtenerDestinoPendiente(): string | null;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Notificaciones');
