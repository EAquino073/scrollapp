import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { contenedor } from '../../di/container';
import { useSesion } from '../viewmodels/SesionContext';

/**
 * Trabajo de fondo que no depende de ninguna pantalla:
 * - registra la sesión de uso de la app (`sesionesApp`),
 * - escribe el `ScrollLog` del día y recupera los días que faltaran, de modo que el dato
 *   del estudio no se pierde aunque el participante nunca abra el check-in,
 * - cierra las semanas que ya terminaron (estadísticas, línea base y metas progresivas).
 */
export function PuenteCicloApp() {
  const { usuario, recargarUsuario } = useSesion();
  const uid = usuario?.onboardingCompletado ? usuario.uid : null;
  const ejecutando = useRef(false);

  const trabajoDeFondo = useCallback(async () => {
    if (!usuario || !usuario.onboardingCompletado || ejecutando.current) {
      return;
    }
    ejecutando.current = true;
    try {
      await contenedor.casosDeUso.registrarUsoAutomatico.ejecutar(usuario.uid, usuario.fechaRegistro);
      const cerradas = await contenedor.casosDeUso.cerrarSemanasPendientes.ejecutar(usuario);
      if (cerradas.length > 0) {
        await recargarUsuario();
      }
    } catch (e) {
      console.warn('[ScrollApp] Falló el trabajo de fondo al abrir la app', e);
    } finally {
      ejecutando.current = false;
    }
  }, [recargarUsuario, usuario]);

  useEffect(() => {
    if (!uid) {
      return;
    }
    contenedor.casosDeUso.registrarSesionApp.abrir(uid);
    trabajoDeFondo();

    const suscripcion = AppState.addEventListener('change', estado => {
      if (estado === 'active') {
        contenedor.casosDeUso.registrarSesionApp.abrir(uid);
        trabajoDeFondo();
      } else if (estado === 'background') {
        contenedor.casosDeUso.registrarSesionApp.cerrar();
      }
    });
    return () => {
      suscripcion.remove();
      contenedor.casosDeUso.registrarSesionApp.cerrar();
    };
  }, [trabajoDeFondo, uid]);

  return null;
}
