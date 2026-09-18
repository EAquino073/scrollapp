import { useCallback, useEffect, useState } from 'react';
import { contenedor } from '../../di/container';
import type { ScrollTarget } from '../../domain/entities';
import type { RevisionSemanal } from '../../domain/usecases';
import { numeroSemanaDelEstudio } from '../../domain/utilidades';
import { useSesion } from './SesionContext';

export interface RevisionSemanalViewModel {
  revision: RevisionSemanal | null;
  /** Semanas ya cerradas que se pueden consultar. */
  semanasDisponibles: number[];
  semanaSeleccionada: number | null;
  seleccionarSemana(semana: number): void;
  /** Metas vigentes tras el cierre (la semana en curso). */
  metasVigentes: ScrollTarget[];
  semanaActual: number;
  cargando: boolean;
  error: string | null;
}

/**
 * ViewModel de la revisión semanal. Cierra primero las semanas pendientes (por si la app
 * llevaba días sin abrirse) y muestra la revisión de la última semana cerrada.
 */
export function useRevisionSemanalViewModel(semanaInicial?: number): RevisionSemanalViewModel {
  const { usuario, recargarUsuario } = useSesion();
  const [revision, setRevision] = useState<RevisionSemanal | null>(null);
  const [semanasDisponibles, setSemanasDisponibles] = useState<number[]>([]);
  const [semanaSeleccionada, setSemanaSeleccionada] = useState<number | null>(semanaInicial ?? null);
  const [metasVigentes, setMetasVigentes] = useState<ScrollTarget[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const semanaActual = usuario ? numeroSemanaDelEstudio(usuario.fechaRegistro) : 1;

  const cargar = useCallback(
    async (semanaPedida?: number) => {
      if (!usuario) {
        return;
      }
      setCargando(true);
      setError(null);
      try {
        const cerradas = await contenedor.casosDeUso.cerrarSemanasPendientes.ejecutar(usuario);
        if (cerradas.length > 0) {
          await recargarUsuario();
        }
        const historial = await contenedor.repositorios.estadisticas.obtenerHistorial(usuario.uid);
        const semanas = historial.map(s => s.numeroSemana).sort((a, b) => a - b);
        setSemanasDisponibles(semanas);

        const semana = semanaPedida ?? semanaSeleccionada ?? semanas[semanas.length - 1];
        if (!semana) {
          setRevision(null);
          return;
        }
        setSemanaSeleccionada(semana);
        setRevision(await contenedor.casosDeUso.generarRevisionSemanal.ejecutar(usuario, semana));
        setMetasVigentes(await contenedor.repositorios.scroll.obtenerMetasActivas(usuario.uid));
      } catch (e) {
        console.warn('[ScrollApp] No se pudo preparar la revisión semanal', e);
        setError('No pudimos preparar tu revisión. Revisa la conexión e inténtalo de nuevo.');
      } finally {
        setCargando(false);
      }
    },
    // `semanaSeleccionada` se lee dentro pero no debe reejecutar la carga por sí mismo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [recargarUsuario, usuario],
  );

  useEffect(() => {
    cargar(semanaInicial);
  }, [cargar, semanaInicial]);

  const seleccionarSemana = useCallback(
    (semana: number) => {
      setSemanaSeleccionada(semana);
      cargar(semana);
    },
    [cargar],
  );

  return {
    revision,
    semanasDisponibles,
    semanaSeleccionada,
    seleccionarSemana,
    metasVigentes,
    semanaActual,
    cargando,
    error,
  };
}
