import NativeNotificaciones from '../specs/NativeNotificaciones';

/**
 * Fachada en español del módulo nativo `Notificaciones`. Implementa el puerto
 * `RecordatoriosLocales` del dominio.
 */
export interface HoraRecordatorio {
  hora: number;
  minuto: number;
}

export const HORA_CHECKIN_POR_DEFECTO: HoraRecordatorio = { hora: 21, minuto: 0 };

export const Notificaciones = {
  programarCheckInDiario(hora: number, minuto: number): void {
    NativeNotificaciones.programarCheckInDiario(hora, minuto);
  },
  cancelarCheckInDiario(): void {
    NativeNotificaciones.cancelarCheckInDiario();
  },
  estaProgramadoCheckIn(): boolean {
    return NativeNotificaciones.estaProgramadoCheckIn();
  },
  horaCheckIn(): HoraRecordatorio {
    return {
      hora: NativeNotificaciones.horaCheckIn(),
      minuto: NativeNotificaciones.minutoCheckIn(),
    };
  },
  avisarRevisionSemanal(titulo: string, texto: string): void {
    NativeNotificaciones.mostrarAvisoRevisionSemanal(titulo, texto);
  },
  tomarDestinoPendiente(): string | null {
    return NativeNotificaciones.obtenerDestinoPendiente();
  },
};

export type NotificacionesModulo = typeof Notificaciones;
