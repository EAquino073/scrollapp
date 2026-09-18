import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { contenedor } from '../../di/container';
import type { ScrollTarget } from '../../domain/entities';
import type { UsoPorRedSocial } from '../../domain/repositories';
import type { EstadoMonitoreo } from '../../domain/usecases';
import { useSesion } from './SesionContext';

export interface MonitoreoViewModel {
  estado: EstadoMonitoreo | null;
  /** Redes sociales que el usuario eligió monitorear. */
  redes: string[];
  /** Metas activas con límite real (a partir de la semana 2). */
  metasConLimite: ScrollTarget[];
  usoHoy: UsoPorRedSocial[];
  cargandoUso: boolean;
  mensaje: string | null;
  refrescar(): void;
  abrirPermisoUso(): void;
  abrirSuperposicion(): void;
  solicitarBateria(): void;
  iniciar(): Promise<void>;
  detener(): void;
}

/**
 * ViewModel del monitoreo nativo: estado de permisos, inicio/detención y uso del día.
 * Se refresca al volver a primer plano, porque los permisos se conceden en Ajustes de Android.
 */
export function useMonitoreoViewModel(): MonitoreoViewModel {
  const { usuario } = useSesion();
  const gestionar = contenedor.casosDeUso.gestionarMonitoreo;
  const uid = usuario?.uid ?? null;
  const redesDelUsuario = usuario?.redesSocialesPrincipales;
  const redes = useMemo(() => redesDelUsuario ?? [], [redesDelUsuario]);
  const clavesRedes = redes.join('|');

  const [estado, setEstado] = useState<EstadoMonitoreo | null>(null);
  const [metasConLimite, setMetasConLimite] = useState<ScrollTarget[]>([]);
  const [usoHoy, setUsoHoy] = useState<UsoPorRedSocial[]>([]);
  const [cargandoUso, setCargandoUso] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const refrescar = useCallback(() => {
    try {
      setEstado(gestionar.consultarEstado());
    } catch (e) {
      console.warn('[ScrollApp] No se pudo consultar el estado del monitoreo', e);
    }
  }, [gestionar]);

  const cargarUso = useCallback(async () => {
    const lista = clavesRedes ? clavesRedes.split('|') : [];
    if (lista.length === 0) {
      setUsoHoy([]);
      setMetasConLimite([]);
      return;
    }
    setCargandoUso(true);
    try {
      setUsoHoy(await gestionar.usoDelDia(lista));
    } catch (e) {
      console.warn('[ScrollApp] No se pudo leer el uso del día', e);
    } finally {
      setCargandoUso(false);
    }
    if (uid) {
      try {
        const metas = await contenedor.repositorios.scroll.obtenerMetasActivas(uid);
        setMetasConLimite(metas.filter(meta => meta.limiteMinutosDiarios > 0));
      } catch (e) {
        console.warn('[ScrollApp] No se pudieron leer las metas activas', e);
      }
    }
  }, [clavesRedes, gestionar, uid]);

  useEffect(() => {
    refrescar();
    cargarUso();
    const suscripcion = AppState.addEventListener('change', siguiente => {
      if (siguiente === 'active') {
        refrescar();
        cargarUso();
      }
    });
    return () => suscripcion.remove();
  }, [cargarUso, refrescar]);

  const pedirPermisoNotificaciones = async () => {
    if (Platform.OS !== 'android' || Platform.Version < 33) {
      return;
    }
    await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  };

  const iniciar = useCallback(async () => {
    setMensaje(null);
    if (!usuario?.onboardingCompletado) {
      setMensaje('Primero completa la configuración inicial para que sepamos qué redes acompañar.');
      return;
    }
    if (redes.length === 0) {
      setMensaje('Todavía no elegiste qué redes acompañar. Puedes hacerlo aquí en Ajustes.');
      return;
    }
    await pedirPermisoNotificaciones();
    const iniciado = gestionar.iniciar(redes);
    if (!iniciado) {
      setMensaje('Falta conceder el acceso a datos de uso para poder acompañarte.');
    }
    refrescar();
  }, [gestionar, redes, refrescar, usuario?.onboardingCompletado]);

  const detener = useCallback(() => {
    gestionar.detener();
    setMensaje(null);
    refrescar();
  }, [gestionar, refrescar]);

  return {
    estado,
    redes,
    metasConLimite,
    usoHoy,
    cargandoUso,
    mensaje,
    refrescar,
    abrirPermisoUso: () => gestionar.abrirAjustesPermisoUso(),
    abrirSuperposicion: () => gestionar.abrirAjustesSuperposicion(),
    solicitarBateria: () => gestionar.solicitarExencionBateria(),
    iniciar,
    detener,
  };
}
