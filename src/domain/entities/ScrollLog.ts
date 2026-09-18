/**
 * Registro diario y automático de uso de una red social.
 * Colección: `registrosScroll`. El `logId` es el ID del documento.
 * `fecha` es el día calendario en formato ISO `YYYY-MM-DD`.
 */
export interface ScrollLog {
  logId: string;
  targetId: string;
  userId: string;
  redSocial: string;
  fecha: string;
  minutosUsados: number;
  aperturas: number;
  cumplioLimite: boolean;
  timestamp: Date;
}
