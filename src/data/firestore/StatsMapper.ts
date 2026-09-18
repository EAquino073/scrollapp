import type { WeeklyStats } from '../../domain/entities';

/** Documento de `estadisticasSemanales` (el `statId` no se guarda como campo). */
export interface WeeklyStatsDoc {
  userId: string;
  numeroSemana: number;
  diasActivos: number;
  sesionesApp: number;
  minutosScrollPromedio: number;
  porcentajeCumplimientoLimite: number;
  porcentajeCumplimientoHabitos: number;
  usuarioActivo: boolean;
}

export function statsADoc(stats: WeeklyStats): WeeklyStatsDoc {
  return {
    userId: stats.userId,
    numeroSemana: stats.numeroSemana,
    diasActivos: stats.diasActivos,
    sesionesApp: stats.sesionesApp,
    minutosScrollPromedio: stats.minutosScrollPromedio,
    porcentajeCumplimientoLimite: stats.porcentajeCumplimientoLimite,
    porcentajeCumplimientoHabitos: stats.porcentajeCumplimientoHabitos,
    usuarioActivo: stats.usuarioActivo,
  };
}

export function docAStats(statId: string, data: Partial<WeeklyStatsDoc>): WeeklyStats {
  return {
    statId,
    userId: data.userId ?? '',
    numeroSemana: data.numeroSemana ?? 1,
    diasActivos: data.diasActivos ?? 0,
    sesionesApp: data.sesionesApp ?? 0,
    minutosScrollPromedio: data.minutosScrollPromedio ?? 0,
    porcentajeCumplimientoLimite: data.porcentajeCumplimientoLimite ?? 0,
    porcentajeCumplimientoHabitos: data.porcentajeCumplimientoHabitos ?? 0,
    usuarioActivo: data.usuarioActivo ?? false,
  };
}
