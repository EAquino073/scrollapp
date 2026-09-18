/**
 * Decisión que toma el usuario en la pantalla de fricción
 * al intentar abrir una red social monitoreada.
 */
export const DecisionFriccion = {
  CONTINUAR: 'CONTINUAR',
  SUSTITUIR: 'SUSTITUIR',
} as const;

export type DecisionFriccion = (typeof DecisionFriccion)[keyof typeof DecisionFriccion];
