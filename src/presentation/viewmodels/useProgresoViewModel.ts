import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { contenedor } from '../../di/container';
import { calcularCumplimiento, type ScrollTarget, type WeeklyStats } from '../../domain/entities';
import { numeroSemanaDelEstudio } from '../../domain/utilidades';
import { useSesion } from './SesionContext';

export interface ProgresoViewModel {
  historial: WeeklyStats[];
  metasVigentes: ScrollTarget[];
  semanaActual: number;
  baselineMinutos: number;
  /** Diferencia entre la línea base y la última semana cerrada (negativa = menos uso). */
  diferenciaDesdeBaseline: number | null;
  /** Promedio de cumplimiento global de todas las semanas cerradas. */
  cumplimientoAcumulado: number | null;
  /** Total de actividades completadas en todo el estudio. */
  actividadesCompletadas: number;
  cargando: boolean;
  encuestaDisponible: boolean;
  recargar(): Promise<void>;
}

/**
 * ViewModel de la pestaña Progreso: trayectoria a largo plazo. El progreso se presenta
 * como patrón acumulado; ninguna semana floja borra lo anterior.
 */
export function useProgresoViewModel(): ProgresoViewModel {
  const { usuario, recargarUsuario } = useSesion();
  const [historial, setHistorial] = useState<WeeklyStats[]>([]);
  const [metasVigentes, setMetasVigentes] = useState<ScrollTarget[]>([]);
  const [actividadesCompletadas, setActividadesCompletadas] = useState(0);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    if (!usuario) {
      return;
    }
    setCargando(true);
    try {
      const cerradas = await contenedor.casosDeUso.cerrarSemanasPendientes.ejecutar(usuario);
      if (cerradas.length > 0) {
        await recargarUsuario();
      }
      const [stats, metas] = await Promise.all([
        contenedor.repositorios.estadisticas.obtenerHistorial(usuario.uid),
        contenedor.repositorios.scroll.obtenerMetasActivas(usuario.uid),
      ]);
      setHistorial(stats);
      setMetasVigentes(metas);

      let completadas = 0;
      for (const semana of stats) {
        const logs = await contenedor.repositorios.habitos.obtenerLogsPorSemana(
          usuario.uid,
          semana.numeroSemana,
        );
        completadas += logs.filter(l => l.cumplido).length;
      }
      setActividadesCompletadas(completadas);
    } catch (e) {
      console.warn('[ScrollApp] No se pudo cargar el progreso', e);
    } finally {
      setCargando(false);
    }
  }, [recargarUsuario, usuario]);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  const semanaActual = usuario ? numeroSemanaDelEstudio(usuario.fechaRegistro) : 1;
  const baselineMinutos = usuario?.tiempoUsoDiarioBaseline ?? 0;
  const ultima = historial.length > 0 ? historial[historial.length - 1] : null;
  const diferenciaDesdeBaseline =
    ultima && baselineMinutos > 0
      ? Math.round((ultima.minutosScrollPromedio - baselineMinutos) * 10) / 10
      : null;
  const cerradasConMeta = historial.filter(s => s.numeroSemana > 1);
  const cumplimientoAcumulado =
    cerradasConMeta.length > 0
      ? Math.round(
          cerradasConMeta.reduce((suma, s) => suma + calcularCumplimiento(s), 0) / cerradasConMeta.length,
        )
      : null;

  return {
    historial,
    metasVigentes,
    semanaActual,
    baselineMinutos,
    diferenciaDesdeBaseline,
    cumplimientoAcumulado,
    actividadesCompletadas,
    cargando,
    encuestaDisponible: usuario
      ? contenedor.casosDeUso.guardarRespuestaEncuesta.estaDisponible(usuario)
      : false,
    recargar,
  };
}
