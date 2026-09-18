/**
 * Resumen semanal por participante. Alimenta la revisión semanal,
 * la ficha de indicadores del estudio y el ajuste de la meta progresiva.
 * Colección: `estadisticasSemanales`. El `statId` es el ID del documento.
 */
export interface WeeklyStats {
  statId: string;
  userId: string;
  numeroSemana: number;
  diasActivos: number;
  sesionesApp: number;
  minutosScrollPromedio: number;
  porcentajeCumplimientoLimite: number;
  porcentajeCumplimientoHabitos: number;
  usuarioActivo: boolean;
}

/**
 * Cumplimiento global de la semana: promedio entre el cumplimiento del
 * límite de scroll y el cumplimiento de hábitos sustitutos (0-100).
 * Equivale a `WeeklyStats.calcularCumplimiento()` del diagrama de clases.
 */
export function calcularCumplimiento(stats: WeeklyStats): number {
  return (stats.porcentajeCumplimientoLimite + stats.porcentajeCumplimientoHabitos) / 2;
}
