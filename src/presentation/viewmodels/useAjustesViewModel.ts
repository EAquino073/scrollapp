import { useCallback, useEffect, useMemo, useState } from 'react';
import { contenedor } from '../../di/container';
import type { ModoIntensidad } from '../../domain/entities';
import type { HoraRecordatorio, RedSocialInstaladaMonitoreo } from '../../domain/repositories';
import { HORA_CHECKIN_POR_DEFECTO } from '../../domain/usecases';
import { useSesion } from './SesionContext';

export interface AjustesViewModel {
  modo: ModoIntensidad | null;
  guardando: boolean;
  mensaje: string | null;
  cambiarModo(modo: ModoIntensidad): Promise<void>;
  redesInstaladas: RedSocialInstaladaMonitoreo[];
  cargandoRedes: boolean;
  redesSeleccionadas: string[];
  hayCambiosRedes: boolean;
  alternarRed(redSocial: string): void;
  guardarRedes(): Promise<void>;
  // Recordatorio del check-in nocturno
  checkInActivo: boolean;
  horaCheckIn: HoraRecordatorio;
  cambiarHoraCheckIn(hora: HoraRecordatorio): void;
  alternarCheckIn(activo: boolean): void;
}

/** ViewModel de Ajustes: intensidad y redes monitoreadas (el usuario controla ambas). */
export function useAjustesViewModel(): AjustesViewModel {
  const { usuario, actualizarUsuarioLocal } = useSesion();
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [redesInstaladas, setRedesInstaladas] = useState<RedSocialInstaladaMonitoreo[]>([]);
  const [cargandoRedes, setCargandoRedes] = useState(true);
  const redesDelUsuario = usuario?.redesSocialesPrincipales;
  const redesActuales = useMemo(() => redesDelUsuario ?? [], [redesDelUsuario]);
  const [redesSeleccionadas, setRedesSeleccionadas] = useState<string[]>(redesActuales);
  const [recordatorio, setRecordatorio] = useState(() => {
    try {
      return contenedor.casosDeUso.gestionarRecordatorios.estado();
    } catch {
      return { activo: false, hora: HORA_CHECKIN_POR_DEFECTO };
    }
  });

  useEffect(() => {
    setRedesSeleccionadas(redesActuales);
  }, [redesActuales]);

  useEffect(() => {
    let vigente = true;
    contenedor.casosDeUso.obtenerRedesInstaladas
      .ejecutar()
      .then(redes => vigente && setRedesInstaladas(redes))
      .catch(e => console.warn('[ScrollApp] No se pudieron listar las redes instaladas', e))
      .finally(() => vigente && setCargandoRedes(false));
    return () => {
      vigente = false;
    };
  }, []);

  const cambiarModo = useCallback(
    async (modo: ModoIntensidad) => {
      if (!usuario || usuario.modoIntensidad === modo) {
        return;
      }
      setGuardando(true);
      setMensaje(null);
      try {
        await contenedor.casosDeUso.actualizarModoIntensidad.ejecutar(usuario.uid, modo);
        actualizarUsuarioLocal({ modoIntensidad: modo });
      } catch (e) {
        console.warn('[ScrollApp] No se pudo cambiar el modo', e);
        setMensaje('No pudimos guardar el cambio. Inténtalo de nuevo en un momento.');
      } finally {
        setGuardando(false);
      }
    },
    [actualizarUsuarioLocal, usuario],
  );

  const alternarRed = useCallback((redSocial: string) => {
    setMensaje(null);
    setRedesSeleccionadas(previas =>
      previas.includes(redSocial) ? previas.filter(r => r !== redSocial) : [...previas, redSocial],
    );
  }, []);

  const hayCambiosRedes = useMemo(() => {
    const a = [...redesActuales].sort().join('|');
    const b = [...redesSeleccionadas].sort().join('|');
    return a !== b;
  }, [redesActuales, redesSeleccionadas]);

  const guardarRedes = useCallback(async () => {
    if (!usuario) {
      return;
    }
    if (redesSeleccionadas.length === 0) {
      setMensaje('Mantén al menos una red para que podamos acompañarte.');
      return;
    }
    setGuardando(true);
    setMensaje(null);
    try {
      await contenedor.casosDeUso.actualizarRedesMonitoreadas.ejecutar(
        usuario.uid,
        usuario.fechaRegistro,
        redesSeleccionadas,
      );
      actualizarUsuarioLocal({ redesSocialesPrincipales: [...redesSeleccionadas] });
      setMensaje('Listo. Desde ahora acompañamos esas redes.');
    } catch (e) {
      console.warn('[ScrollApp] No se pudieron guardar las redes', e);
      setMensaje('No pudimos guardar las redes. Revisa la conexión e inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }, [actualizarUsuarioLocal, redesSeleccionadas, usuario]);

  const cambiarHoraCheckIn = useCallback((hora: HoraRecordatorio) => {
    try {
      contenedor.casosDeUso.gestionarRecordatorios.programarCheckIn(hora);
      setRecordatorio(contenedor.casosDeUso.gestionarRecordatorios.estado());
    } catch (e) {
      console.warn('[ScrollApp] No se pudo cambiar la hora del check-in', e);
    }
  }, []);

  const alternarCheckIn = useCallback(
    (activo: boolean) => {
      const gestor = contenedor.casosDeUso.gestionarRecordatorios;
      try {
        if (activo) {
          gestor.programarCheckIn(recordatorio.hora);
        } else {
          gestor.cancelarCheckIn();
        }
        setRecordatorio(gestor.estado());
      } catch (e) {
        console.warn('[ScrollApp] No se pudo cambiar el recordatorio del check-in', e);
      }
    },
    [recordatorio.hora],
  );

  return {
    modo: usuario?.modoIntensidad ?? null,
    guardando,
    mensaje,
    cambiarModo,
    checkInActivo: recordatorio.activo,
    horaCheckIn: recordatorio.hora,
    cambiarHoraCheckIn,
    alternarCheckIn,
    redesInstaladas,
    cargandoRedes,
    redesSeleccionadas,
    hayCambiosRedes,
    alternarRed,
    guardarRedes,
  };
}
