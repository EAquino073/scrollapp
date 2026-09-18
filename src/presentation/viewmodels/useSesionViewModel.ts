import { useCallback, useEffect, useState } from 'react';
import { mensajeDeErrorAuth } from '../../data/firestore/erroresAuth';
import { contenedor } from '../../di/container';
import type { Usuario } from '../../domain/entities';

/**
 * ViewModel de sesión (hook). Observa Firebase Auth, carga el documento del
 * participante y expone las acciones de registro, acceso y cierre de sesión.
 * Las pantallas solo consumen este estado; nunca tocan Firestore.
 */
export interface SesionViewModel {
  /** `true` mientras se resuelve si ya había una sesión guardada. */
  inicializando: boolean;
  /** `true` mientras se procesa registro, acceso o cierre de sesión. */
  procesando: boolean;
  usuario: Usuario | null;
  error: string | null;
  registrar(correo: string, contrasena: string): Promise<void>;
  iniciarSesion(correo: string, contrasena: string): Promise<void>;
  cerrarSesion(): Promise<void>;
  limpiarError(): void;
  /** Vuelve a leer el documento del participante desde Firestore. */
  recargarUsuario(): Promise<void>;
  /** Aplica cambios ya guardados sin esperar una relectura. */
  actualizarUsuarioLocal(cambios: Partial<Usuario>): void;
}

export function useSesionViewModel(): SesionViewModel {
  const [inicializando, setInicializando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mantiene el estado sincronizado con la sesión de Firebase Auth
  // (incluye la sesión persistida entre aperturas de la app).
  useEffect(() => {
    const cancelar = contenedor.repositorios.auth.observarSesion(async sesion => {
      if (!sesion) {
        setUsuario(null);
        setInicializando(false);
        return;
      }
      try {
        const encontrado = await contenedor.repositorios.usuarios.obtenerUsuario(sesion.uid);
        setUsuario(encontrado);
      } catch (e) {
        console.warn('[ScrollApp] No se pudo cargar el documento del usuario', e);
        setUsuario(null);
      } finally {
        setInicializando(false);
      }
    });
    return cancelar;
  }, []);

  const ejecutarConEstado = useCallback(async (accion: () => Promise<void>) => {
    setError(null);
    setProcesando(true);
    try {
      await accion();
    } catch (e) {
      setError(mensajeDeErrorAuth(e));
    } finally {
      setProcesando(false);
    }
  }, []);

  const registrar = useCallback(
    (correo: string, contrasena: string) =>
      ejecutarConEstado(async () => {
        const creado = await contenedor.casosDeUso.registrarUsuario.ejecutar(correo, contrasena);
        setUsuario(creado);
      }),
    [ejecutarConEstado],
  );

  const iniciarSesion = useCallback(
    (correo: string, contrasena: string) =>
      ejecutarConEstado(async () => {
        const encontrado = await contenedor.casosDeUso.iniciarSesion.ejecutar(correo, contrasena);
        setUsuario(encontrado);
      }),
    [ejecutarConEstado],
  );

  const cerrarSesion = useCallback(
    () =>
      ejecutarConEstado(async () => {
        await contenedor.casosDeUso.cerrarSesion.ejecutar();
        setUsuario(null);
      }),
    [ejecutarConEstado],
  );

  const limpiarError = useCallback(() => setError(null), []);

  const recargarUsuario = useCallback(async () => {
    const sesion = contenedor.repositorios.auth.sesionActual();
    if (!sesion) {
      return;
    }
    try {
      setUsuario(await contenedor.repositorios.usuarios.obtenerUsuario(sesion.uid));
    } catch (e) {
      console.warn('[ScrollApp] No se pudo recargar el usuario', e);
    }
  }, []);

  const actualizarUsuarioLocal = useCallback((cambios: Partial<Usuario>) => {
    setUsuario(actual => (actual ? { ...actual, ...cambios } : actual));
  }, []);

  return {
    inicializando,
    procesando,
    usuario,
    error,
    registrar,
    iniciarSesion,
    cerrarSesion,
    limpiarError,
    recargarUsuario,
    actualizarUsuarioLocal,
  };
}
