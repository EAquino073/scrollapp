import { Timestamp } from '@react-native-firebase/firestore';
import type { DailyReflection } from '../../domain/entities';

/** Documento de `reflexionesDiarias` (el `reflexionId` no se guarda como campo). */
export interface DailyReflectionDoc {
  userId: string;
  fecha: string;
  contenido: string;
  estadoAnimo: string;
  timestamp: Timestamp;
}

export function reflexionADoc(reflexion: DailyReflection): DailyReflectionDoc {
  return {
    userId: reflexion.userId,
    fecha: reflexion.fecha,
    contenido: reflexion.contenido,
    estadoAnimo: reflexion.estadoAnimo,
    timestamp: Timestamp.fromDate(reflexion.timestamp),
  };
}

export function docAReflexion(reflexionId: string, data: Partial<DailyReflectionDoc>): DailyReflection {
  return {
    reflexionId,
    userId: data.userId ?? '',
    fecha: data.fecha ?? '',
    contenido: data.contenido ?? '',
    estadoAnimo: data.estadoAnimo ?? '',
    timestamp: data.timestamp?.toDate() ?? new Date(),
  };
}
