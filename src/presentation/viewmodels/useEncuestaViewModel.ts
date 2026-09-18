import { useCallback, useEffect, useMemo, useState } from 'react';
import { SECCIONES_ENCUESTA } from '../../data/contenido';
import { contenedor } from '../../di/container';
import type { SurveyResponse } from '../../domain/entities';
import { useSesion } from './SesionContext';

/** Respuestas por afirmación, con clave `B-0`, `B-1`, ... */
export type RespuestasPorItem = Record<string, number>;

export interface EncuestaViewModel {
  respuestas: RespuestasPorItem;
  responder(clave: string, valor: number): void;
  abierta1: string;
  setAbierta1(texto: string): void;
  abierta2: string;
  setAbierta2(texto: string): void;
  totalItems: number;
  respondidos: number;
  completa: boolean;
  guardando: boolean;
  guardada: boolean;
  respuestaPrevia: SurveyResponse | null;
  error: string | null;
  enviar(): Promise<boolean>;
}

function claveItem(seccion: string, indice: number): string {
  return `${seccion}-${indice}`;
}

/** ViewModel de la encuesta final: escala por afirmación y promedio por sección. */
export function useEncuestaViewModel(): EncuestaViewModel {
  const { usuario } = useSesion();
  const [respuestas, setRespuestas] = useState<RespuestasPorItem>({});
  const [abierta1, setAbierta1] = useState('');
  const [abierta2, setAbierta2] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardada, setGuardada] = useState(false);
  const [respuestaPrevia, setRespuestaPrevia] = useState<SurveyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalItems = useMemo(
    () => SECCIONES_ENCUESTA.reduce((suma, seccion) => suma + seccion.afirmaciones.length, 0),
    [],
  );

  useEffect(() => {
    if (!usuario) {
      return;
    }
    let vigente = true;
    contenedor.casosDeUso.guardarRespuestaEncuesta
      .obtenerRespuesta(usuario.uid)
      .then(previa => {
        if (!vigente || !previa) {
          return;
        }
        setRespuestaPrevia(previa);
        setAbierta1(previa.preguntaAbierta1);
        setAbierta2(previa.preguntaAbierta2);
      })
      .catch(e => console.warn('[ScrollApp] No se pudo leer la encuesta previa', e));
    return () => {
      vigente = false;
    };
  }, [usuario]);

  const responder = useCallback((clave: string, valor: number) => {
    setError(null);
    setGuardada(false);
    setRespuestas(previas => ({ ...previas, [clave]: valor }));
  }, []);

  const respondidos = Object.keys(respuestas).length;
  const completa = respondidos === totalItems;

  const enviar = useCallback(async () => {
    if (!usuario) {
      return false;
    }
    if (!completa) {
      setError('Falta responder alguna afirmación. Tómate tu tiempo, no hay prisa.');
      return false;
    }
    const promedio = (clave: string) => {
      const seccion = SECCIONES_ENCUESTA.find(s => s.clave === clave);
      if (!seccion) {
        return 0;
      }
      const valores = seccion.afirmaciones.map((_, i) => respuestas[claveItem(clave, i)] ?? 0);
      return valores.reduce((suma, v) => suma + v, 0) / valores.length;
    };

    setGuardando(true);
    setError(null);
    try {
      await contenedor.casosDeUso.guardarRespuestaEncuesta.ejecutar(
        usuario.uid,
        {
          promedioB: promedio('B'),
          promedioC: promedio('C'),
          promedioD: promedio('D'),
          promedioE: promedio('E'),
          preguntaAbierta1: abierta1,
          preguntaAbierta2: abierta2,
        },
        respuestaPrevia,
      );
      setGuardada(true);
      return true;
    } catch (e) {
      console.warn('[ScrollApp] No se pudo guardar la encuesta', e);
      setError('No pudimos guardar tus respuestas. Revisa la conexión e inténtalo de nuevo.');
      return false;
    } finally {
      setGuardando(false);
    }
  }, [abierta1, abierta2, completa, respuestaPrevia, respuestas, usuario]);

  return {
    respuestas,
    responder,
    abierta1,
    setAbierta1,
    abierta2,
    setAbierta2,
    totalItems,
    respondidos,
    completa,
    guardando,
    guardada,
    respuestaPrevia,
    error,
    enviar,
  };
}

export { claveItem };
