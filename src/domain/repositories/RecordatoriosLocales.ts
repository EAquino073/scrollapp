/**
 * Puerto de los recordatorios locales (notificaciones del sistema). Lo implementa la
 * fachada del módulo nativo `Notificaciones`; el dominio solo conoce esta interfaz.
 * Las notificaciones son locales: no se guardan en Firestore.
 */
export interface HoraRecordatorio {
  hora: number;
  minuto: number;
}

export interface RecordatoriosLocales {
  programarCheckInDiario(hora: number, minuto: number): void;
  cancelarCheckInDiario(): void;
  estaProgramadoCheckIn(): boolean;
  horaCheckIn(): HoraRecordatorio;
  avisarRevisionSemanal(titulo: string, texto: string): void;
  /** Pantalla a abrir si la app se lanzó desde una notificación. */
  tomarDestinoPendiente(): string | null;
}
