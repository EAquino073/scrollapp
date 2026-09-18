import { Timestamp } from '@react-native-firebase/firestore';
import type { SurveyResponse } from '../../domain/entities';

/** Documento de `respuestasEncuesta` (el `responseId` no se guarda como campo). */
export interface SurveyResponseDoc {
  userId: string;
  seccionB_promedio: number;
  seccionC_promedio: number;
  seccionD_promedio: number;
  seccionE_promedio: number;
  preguntaAbierta1: string;
  preguntaAbierta2: string;
  fechaRespuesta: Timestamp;
}

export function respuestaADoc(respuesta: SurveyResponse): SurveyResponseDoc {
  return {
    userId: respuesta.userId,
    seccionB_promedio: respuesta.seccionB_promedio,
    seccionC_promedio: respuesta.seccionC_promedio,
    seccionD_promedio: respuesta.seccionD_promedio,
    seccionE_promedio: respuesta.seccionE_promedio,
    preguntaAbierta1: respuesta.preguntaAbierta1,
    preguntaAbierta2: respuesta.preguntaAbierta2,
    fechaRespuesta: Timestamp.fromDate(respuesta.fechaRespuesta),
  };
}

export function docARespuesta(responseId: string, data: Partial<SurveyResponseDoc>): SurveyResponse {
  return {
    responseId,
    userId: data.userId ?? '',
    seccionB_promedio: data.seccionB_promedio ?? 0,
    seccionC_promedio: data.seccionC_promedio ?? 0,
    seccionD_promedio: data.seccionD_promedio ?? 0,
    seccionE_promedio: data.seccionE_promedio ?? 0,
    preguntaAbierta1: data.preguntaAbierta1 ?? '',
    preguntaAbierta2: data.preguntaAbierta2 ?? '',
    fechaRespuesta: data.fechaRespuesta?.toDate() ?? new Date(),
  };
}
