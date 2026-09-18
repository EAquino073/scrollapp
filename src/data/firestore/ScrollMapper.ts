import { Timestamp } from '@react-native-firebase/firestore';
import { DecisionFriccion, type FrictionEvent, type ScrollLog, type ScrollTarget } from '../../domain/entities';

/** Documentos de `metasScroll`, `registrosScroll` y `eventosFriccion` (el ID no se guarda como campo). */

export interface ScrollTargetDoc {
  userId: string;
  redSocial: string;
  limiteMinutosDiarios: number;
  numeroSemana: number;
  fechaCreacion: Timestamp;
  activo: boolean;
}

export interface ScrollLogDoc {
  userId: string;
  targetId: string;
  redSocial: string;
  fecha: string;
  minutosUsados: number;
  aperturas: number;
  cumplioLimite: boolean;
  timestamp: Timestamp;
}

export interface FrictionEventDoc {
  userId: string;
  redSocial: string;
  decision: DecisionFriccion;
  habitId: string | null;
  timestamp: Timestamp;
}

export function targetADoc(target: ScrollTarget): ScrollTargetDoc {
  return {
    userId: target.userId,
    redSocial: target.redSocial,
    limiteMinutosDiarios: target.limiteMinutosDiarios,
    numeroSemana: target.numeroSemana,
    fechaCreacion: Timestamp.fromDate(target.fechaCreacion),
    activo: target.activo,
  };
}

export function docATarget(targetId: string, data: Partial<ScrollTargetDoc>): ScrollTarget {
  return {
    targetId,
    userId: data.userId ?? '',
    redSocial: data.redSocial ?? '',
    limiteMinutosDiarios: data.limiteMinutosDiarios ?? 0,
    numeroSemana: data.numeroSemana ?? 1,
    fechaCreacion: data.fechaCreacion?.toDate() ?? new Date(),
    activo: data.activo ?? true,
  };
}

export function scrollLogADoc(log: ScrollLog): ScrollLogDoc {
  return {
    userId: log.userId,
    targetId: log.targetId,
    redSocial: log.redSocial,
    fecha: log.fecha,
    minutosUsados: log.minutosUsados,
    aperturas: log.aperturas,
    cumplioLimite: log.cumplioLimite,
    timestamp: Timestamp.fromDate(log.timestamp),
  };
}

export function docAScrollLog(logId: string, data: Partial<ScrollLogDoc>): ScrollLog {
  return {
    logId,
    userId: data.userId ?? '',
    targetId: data.targetId ?? '',
    redSocial: data.redSocial ?? '',
    fecha: data.fecha ?? '',
    minutosUsados: data.minutosUsados ?? 0,
    aperturas: data.aperturas ?? 0,
    cumplioLimite: data.cumplioLimite ?? false,
    timestamp: data.timestamp?.toDate() ?? new Date(),
  };
}

export function frictionEventADoc(evento: FrictionEvent): FrictionEventDoc {
  return {
    userId: evento.userId,
    redSocial: evento.redSocial,
    decision: evento.decision,
    habitId: evento.habitId ?? null,
    timestamp: Timestamp.fromDate(evento.timestamp),
  };
}

export function docAFrictionEvent(eventId: string, data: Partial<FrictionEventDoc>): FrictionEvent {
  return {
    eventId,
    userId: data.userId ?? '',
    redSocial: data.redSocial ?? '',
    decision: data.decision ?? DecisionFriccion.CONTINUAR,
    habitId: data.habitId ?? null,
    timestamp: data.timestamp?.toDate() ?? new Date(),
  };
}
