/**
 * Intensidad con la que la app interviene. La controla el usuario.
 * - SUAVE: fricción mínima, recordatorios discretos.
 * - MEDIO: equilibrio entre acompañamiento y autonomía.
 * - FUERTE: pausas más largas y sugerencias más insistentes (nunca bloqueo).
 */
export const ModoIntensidad = {
  SUAVE: 'SUAVE',
  MEDIO: 'MEDIO',
  FUERTE: 'FUERTE',
} as const;

export type ModoIntensidad = (typeof ModoIntensidad)[keyof typeof ModoIntensidad];

export const MODOS_INTENSIDAD: ModoIntensidad[] = ['SUAVE', 'MEDIO', 'FUERTE'];
