import { useCallback, useEffect, useRef, useState } from 'react';
import { contenedor } from '../../di/container';
import type { HabitLog, ReplacementHabit } from '../../domain/entities';
import { useSesion } from './SesionContext';

export interface SustitucionViewModel {
  habito: ReplacementHabit | null;
  cargando: boolean;
  segundosTotales: number;
  segundosRestantes: number;
  progreso: number;
  terminado: boolean;
  guardando: boolean;
  /** Registra el hábito como cumplido. */
  completar(): Promise<HabitLog | null>;
  /** Registra el hábito como no cumplido (sin culpa). */
  abandonar(): Promise<HabitLog | null>;
}

/**
 * ViewModel de la micro-actividad sustituta: temporizador de 2-3 minutos basado en la
 * hora de inicio (sigue contando aunque la app pase a segundo plano) y registro del
 * cumplimiento en `registrosHabitos`.
 */
export function useSustitucionViewModel(habitId: string): SustitucionViewModel {
  const { usuario } = useSesion();
  const [habito, setHabito] = useState<ReplacementHabit | null>(null);
  const [cargando, setCargando] = useState(true);
  const [segundosRestantes, setSegundosRestantes] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const inicio = useRef<number | null>(null);
  const registrado = useRef(false);

  const segundosTotales = (habito?.duracionMinutos ?? 2) * 60;

  useEffect(() => {
    if (!usuario) {
      return;
    }
    let vigente = true;
    contenedor.casosDeUso.obtenerHabitosSustitutos
      .ejecutar(usuario.uid)
      .then(lista => {
        if (!vigente) {
          return;
        }
        setHabito(lista.find(h => h.habitId === habitId) ?? null);
      })
      .catch(e => console.warn('[ScrollApp] No se pudo cargar el hábito', e))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [habitId, usuario]);

  useEffect(() => {
    if (!habito) {
      return;
    }
    inicio.current = Date.now();
    const total = habito.duracionMinutos * 60;
    setSegundosRestantes(total);
    const intervalo = setInterval(() => {
      const transcurridos = Math.floor((Date.now() - (inicio.current ?? Date.now())) / 1000);
      const restantes = Math.max(0, total - transcurridos);
      setSegundosRestantes(restantes);
      if (restantes === 0) {
        clearInterval(intervalo);
      }
    }, 500);
    return () => clearInterval(intervalo);
  }, [habito]);

  const registrar = useCallback(
    async (cumplido: boolean): Promise<HabitLog | null> => {
      if (!usuario || !habito || registrado.current) {
        return null;
      }
      registrado.current = true;
      setGuardando(true);
      try {
        return await contenedor.casosDeUso.registrarCumplimientoHabito.ejecutar(
          usuario.uid,
          habito.habitId,
          cumplido,
        );
      } catch (e) {
        console.warn('[ScrollApp] No se pudo registrar el cumplimiento', e);
        registrado.current = false;
        return null;
      } finally {
        setGuardando(false);
      }
    },
    [habito, usuario],
  );

  return {
    habito,
    cargando,
    segundosTotales,
    segundosRestantes,
    progreso: segundosTotales > 0 ? 1 - segundosRestantes / segundosTotales : 0,
    terminado: habito !== null && segundosRestantes === 0,
    guardando,
    completar: () => registrar(true),
    abandonar: () => registrar(false),
  };
}
