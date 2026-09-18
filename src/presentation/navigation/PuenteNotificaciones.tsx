import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { contenedor } from '../../di/container';
import { useSesion } from '../viewmodels/SesionContext';
import { navegacionRef } from './referencia';

interface Props {
  /** `true` cuando el contenedor de navegación ya está listo. */
  listo: boolean;
}

/**
 * Abre la pantalla correspondiente cuando la app se lanza tocando una notificación local
 * (check-in nocturno o revisión semanal), y se asegura de que el recordatorio diario
 * quede programado para quien ya completó el onboarding.
 */
export function PuenteNotificaciones({ listo }: Props) {
  const { usuario } = useSesion();
  const listoParaNavegar = listo && !!usuario?.onboardingCompletado;

  const revisarDestino = useCallback(() => {
    if (!listoParaNavegar || !navegacionRef.isReady()) {
      return false;
    }
    const destino = contenedor.casosDeUso.gestionarRecordatorios.tomarDestinoPendiente();
    if (destino === 'CheckIn') {
      navegacionRef.navigate('CheckIn');
      return true;
    }
    if (destino === 'RevisionSemanal') {
      navegacionRef.navigate('RevisionSemanal', {});
      return true;
    }
    return false;
  }, [listoParaNavegar]);

  /**
   * `onNewIntent` (que guarda el destino) y el evento `active` de AppState llegan casi a la
   * vez y el orden no está garantizado, así que se vuelve a mirar un par de veces.
   */
  const revisarConReintentos = useCallback(() => {
    if (revisarDestino()) {
      return;
    }
    const reintentos = [300, 900].map(espera => setTimeout(() => revisarDestino(), espera));
    return () => reintentos.forEach(clearTimeout);
  }, [revisarDestino]);

  useEffect(() => {
    if (!listoParaNavegar) {
      return;
    }
    // El recordatorio vive en el sistema; basta con asegurarlo una vez.
    try {
      contenedor.casosDeUso.gestionarRecordatorios.asegurarCheckIn();
    } catch (e) {
      console.warn('[ScrollApp] No se pudo programar el recordatorio del check-in', e);
    }
    revisarConReintentos();
    const suscripcion = AppState.addEventListener('change', estado => {
      if (estado === 'active') {
        revisarConReintentos();
      }
    });
    return () => suscripcion.remove();
  }, [listoParaNavegar, revisarConReintentos]);

  return null;
}
