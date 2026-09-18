import { useCallback, useEffect, useRef, useState } from 'react';
import { contenedor } from '../../di/container';
import { DecisionFriccion, type ModoIntensidad, type ReplacementHabit } from '../../domain/entities';
import type { MensajeFriccion } from '../../domain/usecases';
import { useSesion } from './SesionContext';

/** Segundos de pausa según la intensidad elegida por el usuario. */
export const SEGUNDOS_POR_MODO: Record<ModoIntensidad, number> = {
  SUAVE: 3,
  MEDIO: 8,
  FUERTE: 15,
};

export interface FriccionViewModel {
  modo: ModoIntensidad;
  segundosTotales: number;
  segundosRestantes: number;
  pausaTerminada: boolean;
  /** Mensaje rotativo (motivación propia, frase de pausa o dato del día). */
  mensaje: MensajeFriccion | null;
  /** Una sola actividad sugerida por rotación (modos MEDIO y FUERTE). */
  habitoSugerido: ReplacementHabit | null;
  cargandoHabito: boolean;
  sinHabitos: boolean;
  /** `true` si hay más de una actividad activa y tiene sentido ofrecer otra. */
  puedeCambiarHabito: boolean;
  procesando: boolean;
  /** Cambia la actividad sugerida sin registrar nada. */
  otraActividad(): Promise<void>;
  /** Registra CONTINUAR y devuelve el control a la red social. */
  continuar(): Promise<void>;
  /** Registra SUSTITUIR y devuelve la actividad elegida, o `null` si no hay ninguna. */
  sustituir(): Promise<ReplacementHabit | null>;
}

/**
 * ViewModel de la pausa de fricción. Nunca bloquea: la pausa solo retrasa unos segundos
 * el botón de continuar. Si la pantalla se cierra sin decidir, avisa al monitor para no
 * repetir la pausa en la misma sesión de uso.
 */
export function useFriccionViewModel(paquete: string, redSocial: string): FriccionViewModel {
  const { usuario } = useSesion();
  const modo: ModoIntensidad = usuario?.modoIntensidad ?? 'MEDIO';
  const segundosTotales = SEGUNDOS_POR_MODO[modo];

  const [segundosRestantes, setSegundosRestantes] = useState(segundosTotales);
  const [mensaje, setMensaje] = useState<MensajeFriccion | null>(null);
  const [habitoSugerido, setHabitoSugerido] = useState<ReplacementHabit | null>(null);
  const [activos, setActivos] = useState<ReplacementHabit[]>([]);
  const [cargandoHabito, setCargandoHabito] = useState(modo !== 'SUAVE');
  const [sinHabitos, setSinHabitos] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const decidido = useRef(false);

  // Cuenta regresiva de la pausa.
  useEffect(() => {
    setSegundosRestantes(segundosTotales);
    const inicio = Date.now();
    const intervalo = setInterval(() => {
      const transcurridos = Math.floor((Date.now() - inicio) / 1000);
      const restantes = Math.max(0, segundosTotales - transcurridos);
      setSegundosRestantes(restantes);
      if (restantes === 0) {
        clearInterval(intervalo);
      }
    }, 250);
    return () => clearInterval(intervalo);
  }, [segundosTotales]);

  // Mensaje rotativo: se calcula una sola vez por aparición de la pausa.
  useEffect(() => {
    let vigente = true;
    contenedor.casosDeUso.generarMensajeFriccion
      .ejecutar(usuario, redSocial)
      .then(nuevo => vigente && setMensaje(nuevo))
      .catch(e => console.warn('[ScrollApp] No se pudo generar el mensaje de la pausa', e));
    return () => {
      vigente = false;
    };
  }, [redSocial, usuario]);

  // Actividad sugerida (modos medio y fuerte).
  useEffect(() => {
    if (modo === 'SUAVE' || !usuario) {
      setCargandoHabito(false);
      return;
    }
    let vigente = true;
    contenedor.casosDeUso.obtenerHabitosSustitutos
      .ejecutar(usuario.uid)
      .then(lista => {
        if (!vigente) {
          return;
        }
        setActivos(lista);
        setSinHabitos(lista.length === 0);
        setHabitoSugerido(lista.length > 0 ? lista[Math.floor(Math.random() * lista.length)] : null);
      })
      .catch(e => console.warn('[ScrollApp] No se pudieron cargar las actividades', e))
      .finally(() => vigente && setCargandoHabito(false));
    return () => {
      vigente = false;
    };
  }, [modo, usuario]);

  // Si la pantalla se cierra sin decidir (atrás, inicio), no repetir la pausa enseguida.
  useEffect(() => {
    return () => {
      if (!decidido.current) {
        contenedor.repositorios.monitorDeUso.informarDecision(paquete, 'CANCELAR');
      }
    };
  }, [paquete]);

  const otraActividad = useCallback(async () => {
    if (activos.length <= 1) {
      return;
    }
    const otras = activos.filter(h => h.habitId !== habitoSugerido?.habitId);
    setHabitoSugerido(otras[Math.floor(Math.random() * otras.length)]);
  }, [activos, habitoSugerido]);

  const continuar = useCallback(async () => {
    if (decidido.current) {
      return;
    }
    decidido.current = true;
    setProcesando(true);
    try {
      if (usuario) {
        await contenedor.casosDeUso.registrarDecisionFriccion.ejecutar({
          uid: usuario.uid,
          redSocial,
          decision: DecisionFriccion.CONTINUAR,
        });
      }
    } catch (e) {
      console.warn('[ScrollApp] No se pudo registrar la decisión CONTINUAR', e);
    } finally {
      const monitor = contenedor.repositorios.monitorDeUso;
      monitor.informarDecision(paquete, 'CONTINUAR');
      monitor.volverAAppAnterior();
      setProcesando(false);
    }
  }, [paquete, redSocial, usuario]);

  const sustituir = useCallback(async (): Promise<ReplacementHabit | null> => {
    if (decidido.current || !usuario) {
      return null;
    }
    setProcesando(true);
    try {
      const habito = habitoSugerido;
      if (!habito) {
        setSinHabitos(true);
        return null;
      }
      decidido.current = true;
      await contenedor.casosDeUso.registrarDecisionFriccion.ejecutar({
        uid: usuario.uid,
        redSocial,
        decision: DecisionFriccion.SUSTITUIR,
        habitId: habito.habitId,
      });
      contenedor.repositorios.monitorDeUso.informarDecision(paquete, 'SUSTITUIR');
      return habito;
    } catch (e) {
      console.warn('[ScrollApp] No se pudo registrar la decisión SUSTITUIR', e);
      decidido.current = false;
      return null;
    } finally {
      setProcesando(false);
    }
  }, [habitoSugerido, paquete, redSocial, usuario]);

  return {
    modo,
    segundosTotales,
    segundosRestantes,
    pausaTerminada: segundosRestantes === 0,
    mensaje,
    habitoSugerido,
    cargandoHabito,
    sinHabitos,
    puedeCambiarHabito: activos.length > 1,
    procesando,
    otraActividad,
    continuar,
    sustituir,
  };
}
