/**
 * Respuesta a la encuesta final del estudio (escala Likert 1-5 por sección
 * y dos preguntas abiertas). Colección: `respuestasEncuesta`.
 */
export interface SurveyResponse {
  responseId: string;
  userId: string;
  seccionB_promedio: number;
  seccionC_promedio: number;
  seccionD_promedio: number;
  seccionE_promedio: number;
  preguntaAbierta1: string;
  preguntaAbierta2: string;
  fechaRespuesta: Date;
}
