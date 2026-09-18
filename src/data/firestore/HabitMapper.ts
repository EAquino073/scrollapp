import { Timestamp } from '@react-native-firebase/firestore';
import type { HabitLog, ReplacementHabit, TipoActividad } from '../../domain/entities';

/** Documentos de `habitosSustitutos` y `registrosHabitos` (el ID no se guarda como campo). */

export interface ReplacementHabitDoc {
  userId: string;
  nombre: string;
  duracionMinutos: number;
  fechaCreacion: Timestamp;
  activo: boolean;
  /** Código del catálogo, o `null` en los hábitos propios del usuario. */
  tipoActividad: TipoActividad | null;
}

export interface HabitLogDoc {
  userId: string;
  habitId: string;
  fecha: string;
  cumplido: boolean;
  timestamp: Timestamp;
}

export function habitoADoc(habito: ReplacementHabit): ReplacementHabitDoc {
  return {
    userId: habito.userId,
    nombre: habito.nombre,
    duracionMinutos: habito.duracionMinutos,
    fechaCreacion: Timestamp.fromDate(habito.fechaCreacion),
    activo: habito.activo,
    tipoActividad: habito.tipoActividad,
  };
}

export function docAHabito(habitId: string, data: Partial<ReplacementHabitDoc>): ReplacementHabit {
  return {
    habitId,
    userId: data.userId ?? '',
    nombre: data.nombre ?? '',
    duracionMinutos: data.duracionMinutos ?? 2,
    fechaCreacion: data.fechaCreacion?.toDate() ?? new Date(),
    activo: data.activo ?? true,
    // Los hábitos creados antes de la fase 4 no tienen tipo: se tratan como propios.
    tipoActividad: data.tipoActividad ?? null,
  };
}

export function habitLogADoc(log: HabitLog): HabitLogDoc {
  return {
    userId: log.userId,
    habitId: log.habitId,
    fecha: log.fecha,
    cumplido: log.cumplido,
    timestamp: Timestamp.fromDate(log.timestamp),
  };
}

export function docAHabitLog(logId: string, data: Partial<HabitLogDoc>): HabitLog {
  return {
    logId,
    userId: data.userId ?? '',
    habitId: data.habitId ?? '',
    fecha: data.fecha ?? '',
    cumplido: data.cumplido ?? false,
    timestamp: data.timestamp?.toDate() ?? new Date(),
  };
}
