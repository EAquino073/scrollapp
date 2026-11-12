import { useCallback, useEffect, useRef, useState } from 'react';
import { contenedor } from '../../di/container';
import type { HabitLog, ReplacementHabit } from '../../domain/entities';
import type { ContenidoAsignado } from '../../domain/usecases';
import { useSesion } from './SesionContext';

interface SesionPreparada {
  habito: ReplacementHabit | null;
  asignacion: ContenidoAsignado | null;
}

/** Carga el hábito y, si es predeterminado, le asigna contenido. Nunca rechaza. */
async function prepararSesion(
  uid: string,
  habitId: string,
  gamaDispositivo: string | null,
): Promise<SesionPreparada> {
  try {
    const lista = await contenedor.casosDeUso.obtenerHabitosSustitutos.ejecutar(uid);
    const habito = lista.find(h => h.habitId === habitId) ?? null;
    if (!habito?.tipoActividad) {
      return { habito, asignacion: null };
    }
    try {
      const asignacion = await contenedor.casosDeUso.asignarContenidoGuiado.ejecutar(uid, habito.tipoActividad, {
        gamaDispositivo,
      });
      return { habito, asignacion };
    } catch (e) {
      // Sin contenido, la actividad sigue con el temporizador cálido.
      console.warn('[ScrollApp] No se pudo asignar el contenido guiado', e);
      return { habito, asignacion: null };
    }
  } catch (e) {
    console.warn('[ScrollApp] No se pudo cargar el hábito', e);
    return { habito: null, asignacion: null };
  }
}

export interface SustitucionViewModel {
  habito: ReplacementHabit | null;
  cargando: boolean;
  /**
   * Contenido guiado asignado (actividades predeterminadas). `null` en los hábitos
   * propios del usuario, o si el contenido no pudo cargarse: entonces se usa el
   * temporizador cálido de siempre.
   */
  asignacion: ContenidoAsignado | null;
  segundosTotales: number;
  segundosRestantes: number;
  segundosTranscurridos: number;
  progreso: number;
  terminado: boolean;
  guardando: boolean;
  /** Registra el hábito como cumplido. */
  completar(): Promise<HabitLog | null>;
  /** Registra el hábito como no cumplido (sin culpa). */
  abandonar(): Promise<HabitLog | null>;
}

/**
 * ViewModel de la micro-actividad sustituta: carga el hábito y, si es una actividad
 * predeterminada, le asigna contenido guiado por rotación. El temporizador se basa en la
 * hora de inicio (sigue contando aunque la app pase a segundo plano). Al terminar se
 * registra el cumplimiento en `registrosHabitos`, con el `contenidoId` mostrado.
 */
export function useSustitucionViewModel(habitId: string): SustitucionViewModel {
  const { usuario } = useSesion();
  const uid = usuario?.uid ?? null;
  const gamaDispositivo = usuario?.gamaDispositivo ?? null;
  const [habito, setHabito] = useState<ReplacementHabit | null>(null);
  const [asignacion, setAsignacion] = useState<ContenidoAsignado | null>(null);
  const [cargando, setCargando] = useState(true);
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const registrado = useRef(false);
  // Una sesión de actividad asigna contenido una sola vez: si el efecto se repite, reutiliza
  // la misma promesa en lugar de gastar otro elemento de la rotación.
  const preparacion = useRef<{ clave: string; promesa: Promise<SesionPreparada> } | null>(null);

  const segundosTotales = (habito?.duracionMinutos ?? 2) * 60;

  useEffect(() => {
    if (!uid) {
      return;
    }
    const clave = `${uid}:${habitId}`;
    if (preparacion.current?.clave !== clave) {
      preparacion.current = { clave, promesa: prepararSesion(uid, habitId, gamaDispositivo) };
    }
    let vigente = true;
    preparacion.current.promesa.then(sesion => {
      if (vigente) {
        setHabito(sesion.habito);
        setAsignacion(sesion.asignacion);
        setCargando(false);
      }
    });
    return () => {
      vigente = false;
    };
  }, [gamaDispositivo, habitId, uid]);

  useEffect(() => {
    if (cargando || !habito) {
      return;
    }
    const inicio = Date.now();
    const total = habito.duracionMinutos * 60;
    setSegundosTranscurridos(0);
    const intervalo = setInterval(() => {
      const transcurridos = Math.min(total, Math.floor((Date.now() - inicio) / 1000));
      setSegundosTranscurridos(transcurridos);
      if (transcurridos >= total) {
        clearInterval(intervalo);
      }
    }, 500);
    return () => clearInterval(intervalo);
  }, [cargando, habito]);

  const registrar = useCallback(
    async (cumplido: boolean): Promise<HabitLog | null> => {
      if (!uid || !habito || registrado.current) {
        return null;
      }
      registrado.current = true;
      setGuardando(true);
      try {
        return await contenedor.casosDeUso.registrarCumplimientoHabito.ejecutar(
          uid,
          habito.habitId,
          cumplido,
          asignacion?.contenidoId ?? null,
        );
      } catch (e) {
        console.warn('[ScrollApp] No se pudo registrar el cumplimiento', e);
        registrado.current = false;
        return null;
      } finally {
        setGuardando(false);
      }
    },
    [asignacion, habito, uid],
  );

  const segundosRestantes = Math.max(0, segundosTotales - segundosTranscurridos);

  return {
    habito,
    cargando,
    asignacion,
    segundosTotales,
    segundosRestantes,
    segundosTranscurridos,
    progreso: segundosTotales > 0 ? segundosTranscurridos / segundosTotales : 0,
    terminado: habito !== null && !cargando && segundosRestantes === 0,
    guardando,
    completar: () => registrar(true),
    abandonar: () => registrar(false),
  };
}
