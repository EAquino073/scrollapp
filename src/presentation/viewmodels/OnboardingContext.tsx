import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { contenedor } from '../../di/container';
import { ModoIntensidad } from '../../domain/entities';
import type { EstadoPermisosMonitoreo, RedSocialInstaladaMonitoreo } from '../../domain/repositories';
import type { HabitoNuevo, SugerenciaGama } from '../../domain/usecases';
import { useSesion } from './SesionContext';

export interface BorradorOnboarding {
  rangoEdad: string;
  genero: string;
  gamaDispositivo: string;
  motivacionPersonal: string;
  redesSociales: string[];
  habitos: HabitoNuevo[];
  modoIntensidad: ModoIntensidad;
}

export interface OnboardingViewModel {
  borrador: BorradorOnboarding;
  actualizar(cambios: Partial<BorradorOnboarding>): void;
  sugerenciaGama: SugerenciaGama | null;
  cargandoGama: boolean;
  redesInstaladas: RedSocialInstaladaMonitoreo[];
  cargandoRedes: boolean;
  cargarRedes(): Promise<void>;
  permisos: EstadoPermisosMonitoreo | null;
  refrescarPermisos(): void;
  abrirPermisoUso(): void;
  abrirSuperposicion(): void;
  solicitarBateria(): void;
  finalizando: boolean;
  error: string | null;
  /** Guarda todo, inicia el monitoreo y actualiza la sesión. Devuelve `true` si salió bien. */
  finalizar(): Promise<boolean>;
}

const BORRADOR_INICIAL: BorradorOnboarding = {
  rangoEdad: '',
  genero: '',
  gamaDispositivo: '',
  motivacionPersonal: '',
  redesSociales: [],
  habitos: [],
  modoIntensidad: ModoIntensidad.MEDIO,
};

const OnboardingContext = createContext<OnboardingViewModel | null>(null);

/**
 * ViewModel del onboarding: mantiene el borrador entre pantallas y lo persiste al final
 * con `CompletarOnboarding`. Se monta solo mientras el usuario no ha completado el onboarding.
 */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { usuario, actualizarUsuarioLocal } = useSesion();
  const [borrador, setBorrador] = useState<BorradorOnboarding>(BORRADOR_INICIAL);
  const [sugerenciaGama, setSugerenciaGama] = useState<SugerenciaGama | null>(null);
  const [cargandoGama, setCargandoGama] = useState(true);
  const [redesInstaladas, setRedesInstaladas] = useState<RedSocialInstaladaMonitoreo[]>([]);
  const [cargandoRedes, setCargandoRedes] = useState(false);
  const [permisos, setPermisos] = useState<EstadoPermisosMonitoreo | null>(null);
  const [finalizando, setFinalizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actualizar = useCallback((cambios: Partial<BorradorOnboarding>) => {
    setBorrador(previo => ({ ...previo, ...cambios }));
  }, []);

  // Sugerencia de gama a partir de la RAM y el modelo.
  useEffect(() => {
    let vigente = true;
    contenedor.casosDeUso.detectarGamaDispositivo
      .ejecutar()
      .then(sugerencia => {
        if (!vigente) {
          return;
        }
        setSugerenciaGama(sugerencia);
        setBorrador(previo => (previo.gamaDispositivo ? previo : { ...previo, gamaDispositivo: sugerencia.gama }));
      })
      .catch(e => console.warn('[ScrollApp] No se pudo detectar la gama', e))
      .finally(() => vigente && setCargandoGama(false));
    return () => {
      vigente = false;
    };
  }, []);

  const cargarRedes = useCallback(async () => {
    setCargandoRedes(true);
    try {
      setRedesInstaladas(await contenedor.casosDeUso.obtenerRedesInstaladas.ejecutar());
    } catch (e) {
      console.warn('[ScrollApp] No se pudieron listar las redes instaladas', e);
    } finally {
      setCargandoRedes(false);
    }
  }, []);

  const refrescarPermisos = useCallback(() => {
    try {
      setPermisos(contenedor.casosDeUso.gestionarMonitoreo.consultarEstado().permisos);
    } catch (e) {
      console.warn('[ScrollApp] No se pudieron consultar los permisos', e);
    }
  }, []);

  // Los permisos se conceden en Ajustes de Android: se releen al volver a la app.
  useEffect(() => {
    refrescarPermisos();
    const suscripcion = AppState.addEventListener('change', estado => {
      if (estado === 'active') {
        refrescarPermisos();
      }
    });
    return () => suscripcion.remove();
  }, [refrescarPermisos]);

  const finalizar = useCallback(async () => {
    if (!usuario) {
      return false;
    }
    setFinalizando(true);
    setError(null);
    try {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }
      const actualizado = await contenedor.casosDeUso.completarOnboarding.ejecutar(usuario, borrador);
      actualizarUsuarioLocal(actualizado);
      return true;
    } catch (e) {
      console.warn('[ScrollApp] No se pudo completar el onboarding', e);
      setError('No pudimos guardar tu configuración. Revisa la conexión e inténtalo de nuevo.');
      return false;
    } finally {
      setFinalizando(false);
    }
  }, [actualizarUsuarioLocal, borrador, usuario]);

  const gestionar = contenedor.casosDeUso.gestionarMonitoreo;
  const valor = useMemo<OnboardingViewModel>(
    () => ({
      borrador,
      actualizar,
      sugerenciaGama,
      cargandoGama,
      redesInstaladas,
      cargandoRedes,
      cargarRedes,
      permisos,
      refrescarPermisos,
      abrirPermisoUso: () => gestionar.abrirAjustesPermisoUso(),
      abrirSuperposicion: () => gestionar.abrirAjustesSuperposicion(),
      solicitarBateria: () => gestionar.solicitarExencionBateria(),
      finalizando,
      error,
      finalizar,
    }),
    [
      actualizar,
      borrador,
      cargandoGama,
      cargandoRedes,
      cargarRedes,
      error,
      finalizando,
      finalizar,
      gestionar,
      permisos,
      redesInstaladas,
      refrescarPermisos,
      sugerenciaGama,
    ],
  );

  return <OnboardingContext.Provider value={valor}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingViewModel {
  const contexto = useContext(OnboardingContext);
  if (!contexto) {
    throw new Error('useOnboarding debe usarse dentro de OnboardingProvider');
  }
  return contexto;
}
