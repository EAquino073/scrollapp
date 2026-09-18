import type { SurveyResponse, Usuario } from '../entities';
import type { SurveyRepository } from '../repositories';
import { generarId, numeroSemanaDelEstudio } from '../utilidades';

/** Semana del estudio a partir de la cual se habilita la encuesta final. */
export const SEMANA_ENCUESTA = 7;

export interface RespuestasEncuesta {
  /** Promedios por sección, ya calculados (1 a 5). */
  promedioB: number;
  promedioC: number;
  promedioD: number;
  promedioE: number;
  preguntaAbierta1: string;
  preguntaAbierta2: string;
}

/**
 * Guarda la encuesta final en `respuestasEncuesta`.
 *
 * El diagrama ER define los promedios por sección como enteros, así que se redondean:
 * el detalle por afirmación no se persiste.
 */
export class GuardarRespuestaEncuesta {
  constructor(private readonly surveyRepository: SurveyRepository) {}

  /** La encuesta se habilita al terminar la semana 6 (es decir, en la semana 7). */
  estaDisponible(usuario: Usuario, hoy: Date = new Date()): boolean {
    return numeroSemanaDelEstudio(usuario.fechaRegistro, hoy) >= SEMANA_ENCUESTA;
  }

  obtenerRespuesta(uid: string): Promise<SurveyResponse | null> {
    return this.surveyRepository.obtenerRespuesta(uid);
  }

  async ejecutar(
    uid: string,
    respuestas: RespuestasEncuesta,
    existente?: SurveyResponse | null,
  ): Promise<SurveyResponse> {
    const respuesta: SurveyResponse = {
      responseId: existente?.responseId ?? generarId(),
      userId: uid,
      seccionB_promedio: Math.round(respuestas.promedioB),
      seccionC_promedio: Math.round(respuestas.promedioC),
      seccionD_promedio: Math.round(respuestas.promedioD),
      seccionE_promedio: Math.round(respuestas.promedioE),
      preguntaAbierta1: respuestas.preguntaAbierta1.trim(),
      preguntaAbierta2: respuestas.preguntaAbierta2.trim(),
      fechaRespuesta: new Date(),
    };
    await this.surveyRepository.guardarRespuesta(respuesta);
    return respuesta;
  }
}
