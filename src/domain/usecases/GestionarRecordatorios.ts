import type { HoraRecordatorio, RecordatoriosLocales } from '../repositories';

export const HORA_CHECKIN_POR_DEFECTO: HoraRecordatorio = { hora: 21, minuto: 0 };

/** Opciones de hora del check-in que se ofrecen en Ajustes. */
export const HORAS_CHECKIN: HoraRecordatorio[] = [
  { hora: 19, minuto: 0 },
  { hora: 20, minuto: 0 },
  { hora: 21, minuto: 0 },
  { hora: 22, minuto: 0 },
  { hora: 23, minuto: 0 },
];

export function formatearHora({ hora, minuto }: HoraRecordatorio): string {
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
}

/**
 * Recordatorio local del check-in nocturno: activarlo, cambiar la hora y consultarlo.
 * Las notificaciones son locales; no se guardan en Firestore.
 */
export class GestionarRecordatorios {
  constructor(private readonly recordatorios: RecordatoriosLocales) {}

  estado(): { activo: boolean; hora: HoraRecordatorio } {
    return {
      activo: this.recordatorios.estaProgramadoCheckIn(),
      hora: this.recordatorios.horaCheckIn(),
    };
  }

  programarCheckIn(hora: HoraRecordatorio): void {
    this.recordatorios.programarCheckInDiario(hora.hora, hora.minuto);
  }

  cancelarCheckIn(): void {
    this.recordatorios.cancelarCheckInDiario();
  }

  /** Deja el recordatorio activo con la hora por defecto si aún no se había configurado. */
  asegurarCheckIn(): void {
    if (!this.recordatorios.estaProgramadoCheckIn()) {
      this.programarCheckIn(HORA_CHECKIN_POR_DEFECTO);
    }
  }

  avisarRevisionSemanal(numeroSemana: number): void {
    this.recordatorios.avisarRevisionSemanal(
      'Tu revisión de la semana está lista',
      `Terminó tu semana ${numeroSemana}. Cuando quieras, mírala con calma: es tu patrón, no una nota.`,
    );
  }

  tomarDestinoPendiente(): string | null {
    return this.recordatorios.tomarDestinoPendiente();
  }
}
