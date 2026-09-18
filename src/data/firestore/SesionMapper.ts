import { Timestamp } from '@react-native-firebase/firestore';
import type { AppSession } from '../../domain/entities';

/** Documento de `sesionesApp` (el `sessionId` no se guarda como campo). */
export interface AppSessionDoc {
  userId: string;
  aperturaApp: Timestamp;
  duracionSeg: number;
}

export function sesionADoc(sesion: AppSession): AppSessionDoc {
  return {
    userId: sesion.userId,
    aperturaApp: Timestamp.fromDate(sesion.aperturaApp),
    duracionSeg: sesion.duracionSeg,
  };
}

export function docASesion(sessionId: string, data: Partial<AppSessionDoc>): AppSession {
  return {
    sessionId,
    userId: data.userId ?? '',
    aperturaApp: data.aperturaApp?.toDate() ?? new Date(),
    duracionSeg: data.duracionSeg ?? 0,
  };
}
