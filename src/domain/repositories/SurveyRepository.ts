import type { SurveyResponse } from '../entities';

/** Encuesta final del estudio. */
export interface SurveyRepository {
  guardarRespuesta(respuesta: SurveyResponse): Promise<void>;
  /** Extensión al diagrama: para no volver a pedirla si ya respondió. */
  obtenerRespuesta(uid: string): Promise<SurveyResponse | null>;
}
