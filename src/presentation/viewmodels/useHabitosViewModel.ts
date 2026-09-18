import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { contenedor } from '../../di/container';
import { MAXIMO_HABITOS, MINIMO_HABITOS, type ReplacementHabit } from '../../domain/entities';
import type { DatosHabito } from '../../domain/usecases';
import { useSesion } from './SesionContext';

export interface HabitosViewModel {
  habitos: ReplacementHabit[];
  cargando: boolean;
  guardando: boolean;
  mensaje: string | null;
  recargar(): Promise<void>;
  crear(datos: DatosHabito): Promise<boolean>;
  editar(habito: ReplacementHabit, datos: DatosHabito): Promise<boolean>;
  cambiarActivo(habito: ReplacementHabit, activo: boolean): Promise<void>;
}

/** ViewModel de la pestaña Hábitos: lista (activos e inactivos), alta, edición y activación. */
export function useHabitosViewModel(): HabitosViewModel {
  const { usuario } = useSesion();
  const [habitos, setHabitos] = useState<ReplacementHabit[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const recargar = useCallback(async () => {
    if (!usuario) {
      return;
    }
    setCargando(true);
    try {
      setHabitos(await contenedor.casosDeUso.obtenerHabitosSustitutos.ejecutar(usuario.uid, true));
    } catch (e) {
      console.warn('[ScrollApp] No se pudieron cargar las actividades', e);
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  const validar = (datos: DatosHabito, excluir?: string): string | null => {
    const nombre = datos.nombre.trim();
    if (nombre.length < 3) {
      return 'Ponle un nombre corto a la actividad.';
    }
    const repetido = habitos.some(
      h => h.habitId !== excluir && h.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    return repetido ? 'Ya tienes una actividad con ese nombre.' : null;
  };

  const crear = useCallback(
    async (datos: DatosHabito) => {
      if (!usuario) {
        return false;
      }
      const problema = validar(datos);
      if (problema) {
        setMensaje(problema);
        return false;
      }
      if (habitos.filter(h => h.activo).length >= MAXIMO_HABITOS) {
        setMensaje(`Con ${MAXIMO_HABITOS} actividades activas es suficiente. Desactiva una para agregar otra.`);
        return false;
      }
      setGuardando(true);
      setMensaje(null);
      try {
        const nuevo = await contenedor.casosDeUso.guardarHabitoSustituto.crear(usuario.uid, datos);
        setHabitos(previos => [...previos, nuevo]);
        return true;
      } catch (e) {
        console.warn('[ScrollApp] No se pudo crear la actividad', e);
        setMensaje('No pudimos guardar la actividad. Inténtalo de nuevo.');
        return false;
      } finally {
        setGuardando(false);
      }
    },
    // validar depende de `habitos`, que ya está en las dependencias.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habitos, usuario],
  );

  const editar = useCallback(
    async (habito: ReplacementHabit, datos: DatosHabito) => {
      const problema = validar(datos, habito.habitId);
      if (problema) {
        setMensaje(problema);
        return false;
      }
      setGuardando(true);
      setMensaje(null);
      try {
        const actualizado = await contenedor.casosDeUso.guardarHabitoSustituto.editar(habito, datos);
        setHabitos(previos => previos.map(h => (h.habitId === actualizado.habitId ? actualizado : h)));
        return true;
      } catch (e) {
        console.warn('[ScrollApp] No se pudo editar la actividad', e);
        setMensaje('No pudimos guardar los cambios. Inténtalo de nuevo.');
        return false;
      } finally {
        setGuardando(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [habitos],
  );

  const cambiarActivo = useCallback(
    async (habito: ReplacementHabit, activo: boolean) => {
      const activas = habitos.filter(h => h.activo).length;
      if (activo && activas >= MAXIMO_HABITOS) {
        setMensaje(`Con ${MAXIMO_HABITOS} actividades activas es suficiente. Desactiva otra primero.`);
        return;
      }
      if (!activo && activas <= MINIMO_HABITOS) {
        setMensaje(`Deja al menos ${MINIMO_HABITOS} actividades activas para tener de dónde escoger.`);
        return;
      }
      setMensaje(null);
      try {
        const actualizado = await contenedor.casosDeUso.guardarHabitoSustituto.cambiarActivo(habito, activo);
        setHabitos(previos => previos.map(h => (h.habitId === actualizado.habitId ? actualizado : h)));
      } catch (e) {
        console.warn('[ScrollApp] No se pudo cambiar el estado de la actividad', e);
        setMensaje('No pudimos guardar el cambio. Inténtalo de nuevo.');
      }
    },
    [habitos],
  );

  return { habitos, cargando, guardando, mensaje, recargar, crear, editar, cambiarActivo };
}
