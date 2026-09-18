import { useCallback, useEffect, useState } from 'react';
import { contenedor } from '../../di/container';
import type { CheckInNocturno } from '../../domain/usecases';
import { useSesion } from './SesionContext';

export interface CheckInViewModel {
  resumen: CheckInNocturno | null;
  cargando: boolean;
  error: string | null;
  /** Texto de la reflexión (opcional). */
  contenido: string;
  setContenido(texto: string): void;
  estadoAnimo: string | null;
  setEstadoAnimo(estado: string): void;
  guardando: boolean;
  reflexionGuardada: boolean;
  guardarReflexion(): Promise<boolean>;
  recargar(): Promise<void>;
}

/**
 * ViewModel del check-in nocturno: calcula el resumen del día (lo que también escribe el
 * `ScrollLog`) y gestiona la reflexión diaria opcional.
 */
export function useCheckInViewModel(): CheckInViewModel {
  const { usuario } = useSesion();
  const [resumen, setResumen] = useState<CheckInNocturno | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contenido, setContenido] = useState('');
  const [estadoAnimo, setEstadoAnimo] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [reflexionGuardada, setReflexionGuardada] = useState(false);

  const recargar = useCallback(async () => {
    if (!usuario) {
      return;
    }
    setCargando(true);
    setError(null);
    try {
      const calculado = await contenedor.casosDeUso.calcularCheckInNocturno.ejecutar(usuario);
      setResumen(calculado);
      if (calculado.reflexionDeHoy) {
        setContenido(calculado.reflexionDeHoy.contenido);
        setEstadoAnimo(calculado.reflexionDeHoy.estadoAnimo);
        setReflexionGuardada(true);
      }
    } catch (e) {
      console.warn('[ScrollApp] No se pudo calcular el check-in', e);
      setError('No pudimos preparar tu resumen. Revisa la conexión e inténtalo de nuevo.');
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const guardarReflexion = useCallback(async () => {
    if (!usuario) {
      return false;
    }
    if (!estadoAnimo && contenido.trim().length === 0) {
      setError('Elige cómo te sentiste o escribe algo, lo que prefieras.');
      return false;
    }
    setGuardando(true);
    setError(null);
    try {
      await contenedor.casosDeUso.registrarReflexionDiaria.ejecutar(
        usuario.uid,
        contenido,
        estadoAnimo ?? '',
        resumen?.reflexionDeHoy,
      );
      setReflexionGuardada(true);
      return true;
    } catch (e) {
      console.warn('[ScrollApp] No se pudo guardar la reflexión', e);
      setError('No pudimos guardar tu reflexión. Inténtalo de nuevo en un momento.');
      return false;
    } finally {
      setGuardando(false);
    }
  }, [contenido, estadoAnimo, resumen, usuario]);

  return {
    resumen,
    cargando,
    error,
    contenido,
    setContenido,
    estadoAnimo,
    setEstadoAnimo,
    guardando,
    reflexionGuardada,
    guardarReflexion,
    recargar,
  };
}
