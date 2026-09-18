import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { contenedor } from '../../di/container';
import type { AperturaDetectadaMonitoreo } from '../../domain/repositories';
import { useSesion } from '../viewmodels/SesionContext';
import { navegacionRef } from './referencia';

interface Props {
  /** `true` cuando el contenedor de navegación ya está listo. */
  listo: boolean;
}

/**
 * Puente entre el monitoreo nativo y la navegación: cuando el servicio detecta la
 * apertura de una red social monitoreada, abre la pantalla de fricción.
 * Escucha el evento en tiempo real y, además, revisa si quedó una apertura pendiente
 * al arrancar la app o al volver a primer plano.
 */
export function DetectorApertura({ listo }: Props) {
  const { usuario } = useSesion();
  // Sin onboarding completo no hay redes ni hábitos configurados: se ignoran las aperturas.
  const uid = usuario?.onboardingCompletado ? usuario.uid : null;

  const manejar = useCallback(
    async (apertura: AperturaDetectadaMonitoreo) => {
      const monitor = contenedor.repositorios.monitorDeUso;
      if (!uid || !navegacionRef.isReady()) {
        monitor.informarDecision(apertura.paquete, 'CANCELAR');
        return;
      }
      try {
        const relevante = await contenedor.casosDeUso.detectarAperturaRedSocial.ejecutar(
          uid,
          apertura.paquete,
          apertura.redSocial,
        );
        if (!relevante) {
          monitor.informarDecision(apertura.paquete, 'CANCELAR');
          return;
        }
        const rutaActual = navegacionRef.getCurrentRoute();
        if (rutaActual?.name === 'Friccion') {
          return;
        }
        navegacionRef.navigate('Friccion', { paquete: relevante.paquete, redSocial: relevante.redSocial });
      } catch (e) {
        console.warn('[ScrollApp] No se pudo procesar la apertura detectada', e);
        monitor.informarDecision(apertura.paquete, 'CANCELAR');
      }
    },
    [uid],
  );

  const revisarPendiente = useCallback(() => {
    const pendiente = contenedor.repositorios.monitorDeUso.tomarAperturaPendiente();
    if (pendiente) {
      manejar(pendiente);
    }
  }, [manejar]);

  useEffect(() => {
    if (!listo || !uid) {
      return;
    }
    revisarPendiente();
    const suscripcionEvento = contenedor.repositorios.monitorDeUso.alDetectarApertura(manejar);
    const suscripcionEstado = AppState.addEventListener('change', estado => {
      if (estado === 'active') {
        revisarPendiente();
      }
    });
    return () => {
      suscripcionEvento.remove();
      suscripcionEstado.remove();
    };
  }, [listo, manejar, revisarPendiente, uid]);

  return null;
}
