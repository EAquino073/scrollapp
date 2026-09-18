import { DecisionFriccion, type Usuario, type WeeklyStats } from '../entities';
import type {
  HabitRepository,
  ScrollRepository,
  SessionRepository,
  StatsRepository,
} from '../repositories';
import { fechaISO, generarId, rangoDeSemana } from '../utilidades';

export interface ResumenPorRed {
  redSocial: string;
  minutosPromedio: number;
  aperturasPromedio: number;
  diasDentroDelLimite: number;
  diasConLimite: number;
}

export interface RevisionSemanal {
  stats: WeeklyStats;
  esSemanaDeObservacion: boolean;
  porRed: ResumenPorRed[];
  diasConDatos: number;
  sustituciones: number;
  continuaciones: number;
  habitosCompletados: number;
  /** Diferencia de minutos promedio respecto a la semana anterior (negativa = menos uso). */
  diferenciaConAnterior: number | null;
  /** Patrón acumulado: minutos promedio de todas las semanas cerradas. */
  historial: WeeklyStats[];
  patron: { icono: string; titulo: string; texto: string };
  /** Micro-celebración específica, solo si hubo algo concreto que celebrar. */
  celebracion: { icono: string; titulo: string; texto: string } | null;
}

/** Días con datos a partir de los cuales se considera al participante activo esa semana. */
const DIAS_PARA_ACTIVO = 3;

/**
 * Calcula y guarda las `WeeklyStats` de una semana cerrada, y arma la lectura cálida de
 * la revisión. Corresponde a `GenerarRevisionSemanal` del diagrama de clases.
 *
 * Convenciones (documentadas también en CLAUDE.md):
 * - `minutosScrollPromedio` divide entre los días con datos, no entre 7, para no castigar
 *   los días en que el teléfono estuvo apagado.
 * - En la semana de observación no hay límite que incumplir, así que
 *   `porcentajeCumplimientoLimite` vale 100: al analizar el estudio, la semana 1 se excluye.
 * - `porcentajeCumplimientoHabitos` es "de las actividades que empezaste, cuántas terminaste".
 */
export class GenerarRevisionSemanal {
  constructor(
    private readonly scrollRepository: ScrollRepository,
    private readonly habitRepository: HabitRepository,
    private readonly statsRepository: StatsRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async ejecutar(usuario: Usuario, numeroSemana: number): Promise<RevisionSemanal> {
    const rango = rangoDeSemana(usuario.fechaRegistro, numeroSemana);
    const [logs, logsHabitos, eventos, sesiones, historialPrevio, metas] = await Promise.all([
      this.scrollRepository.obtenerLogsPorSemana(usuario.uid, numeroSemana),
      this.habitRepository.obtenerLogsPorSemana(usuario.uid, numeroSemana),
      this.scrollRepository.obtenerTodosLosEventosFriccion(usuario.uid),
      this.sessionRepository.obtenerSesiones(usuario.uid),
      this.statsRepository.obtenerHistorial(usuario.uid),
      this.scrollRepository.obtenerTodasLasMetas(usuario.uid),
    ]);

    const enRango = (fecha: string) => fecha >= rango.desde && fecha <= rango.hasta;
    const eventosSemana = eventos.filter(e => enRango(fechaISO(e.timestamp)));
    const sesionesSemana = sesiones.filter(s => enRango(fechaISO(s.aperturaApp)));

    const diasConDatos = new Set(logs.map(l => l.fecha)).size;
    const divisor = Math.max(1, diasConDatos);
    const minutosTotales = logs.reduce((suma, l) => suma + l.minutosUsados, 0);

    const redes = Array.from(new Set(logs.map(l => l.redSocial)));
    const porRed: ResumenPorRed[] = redes
      .map(redSocial => {
        const deRed = logs.filter(l => l.redSocial === redSocial);
        const metaDeLaSemana = metas
          .filter(m => m.redSocial === redSocial && m.numeroSemana <= numeroSemana)
          .sort((a, b) => a.numeroSemana - b.numeroSemana)
          .pop();
        const conLimite = (metaDeLaSemana?.limiteMinutosDiarios ?? 0) > 0 ? deRed : [];
        return {
          redSocial,
          minutosPromedio: Math.round((deRed.reduce((s, l) => s + l.minutosUsados, 0) / divisor) * 10) / 10,
          aperturasPromedio: Math.round((deRed.reduce((s, l) => s + l.aperturas, 0) / divisor) * 10) / 10,
          diasDentroDelLimite: conLimite.filter(l => l.cumplioLimite).length,
          diasConLimite: conLimite.length,
        };
      })
      .sort((a, b) => b.minutosPromedio - a.minutosPromedio);

    const diasConLimiteTotal = porRed.reduce((s, r) => s + r.diasConLimite, 0);
    const diasDentroTotal = porRed.reduce((s, r) => s + r.diasDentroDelLimite, 0);
    const esSemanaDeObservacion = diasConLimiteTotal === 0;
    const porcentajeCumplimientoLimite = esSemanaDeObservacion
      ? 100
      : Math.round((diasDentroTotal / diasConLimiteTotal) * 100);

    const habitosCompletados = logsHabitos.filter(l => l.cumplido).length;
    const porcentajeCumplimientoHabitos =
      logsHabitos.length > 0 ? Math.round((habitosCompletados / logsHabitos.length) * 100) : 0;

    const diasActivos = new Set([
      ...logs.filter(l => l.minutosUsados > 0).map(l => l.fecha),
      ...logsHabitos.map(l => l.fecha),
      ...eventosSemana.map(e => fechaISO(e.timestamp)),
      ...sesionesSemana.map(s => fechaISO(s.aperturaApp)),
    ]).size;

    const previa = historialPrevio.find(s => s.numeroSemana === numeroSemana);
    const stats: WeeklyStats = {
      statId: previa?.statId ?? generarId(),
      userId: usuario.uid,
      numeroSemana,
      diasActivos,
      sesionesApp: sesionesSemana.length,
      minutosScrollPromedio: Math.round((minutosTotales / divisor) * 10) / 10,
      porcentajeCumplimientoLimite,
      porcentajeCumplimientoHabitos,
      usuarioActivo: diasActivos >= DIAS_PARA_ACTIVO,
    };
    await this.statsRepository.guardarEstadisticas(stats);

    const anterior = historialPrevio.find(s => s.numeroSemana === numeroSemana - 1);
    const diferenciaConAnterior = anterior
      ? Math.round((stats.minutosScrollPromedio - anterior.minutosScrollPromedio) * 10) / 10
      : null;

    const historial = [...historialPrevio.filter(s => s.numeroSemana !== numeroSemana), stats].sort(
      (a, b) => a.numeroSemana - b.numeroSemana,
    );

    const sustituciones = eventosSemana.filter(e => e.decision === DecisionFriccion.SUSTITUIR).length;
    const continuaciones = eventosSemana.filter(e => e.decision === DecisionFriccion.CONTINUAR).length;

    return {
      stats,
      esSemanaDeObservacion,
      porRed,
      diasConDatos,
      sustituciones,
      continuaciones,
      habitosCompletados,
      diferenciaConAnterior,
      historial,
      patron: this.textoPatron(stats, historial, diferenciaConAnterior, esSemanaDeObservacion),
      celebracion: this.celebracion(stats, habitosCompletados, sustituciones, diferenciaConAnterior, porRed),
    };
  }

  /**
   * Lee la semana como parte de un patrón acumulado. Nunca reinicia nada en cero ni
   * presenta los días flojos como un fracaso.
   */
  private textoPatron(
    stats: WeeklyStats,
    historial: WeeklyStats[],
    diferencia: number | null,
    observacion: boolean,
  ): { icono: string; titulo: string; texto: string } {
    if (observacion) {
      return {
        icono: '🌱',
        titulo: 'Tu punto de partida',
        texto: `Durante estos días usaste tus redes ${stats.minutosScrollPromedio} minutos al día en promedio. No es una nota: es el punto desde el que empieza tu camino.`,
      };
    }
    const semanasAcumuladas = historial.length;
    if (diferencia !== null && diferencia < 0) {
      return {
        icono: '🌿',
        titulo: `Bajaste ${Math.abs(diferencia)} minutos al día`,
        texto: `Llevas ${semanasAcumuladas} semanas midiendo tu ritmo. Esta semana pesó menos que la anterior, y eso se suma a lo que ya traías.`,
      };
    }
    if (diferencia !== null && diferencia > 0) {
      return {
        icono: '🌤️',
        titulo: 'Esta semana pesó un poco más',
        texto: `Subió ${diferencia} minutos al día respecto a la semana pasada. Pasa, y no borra las ${semanasAcumuladas} semanas que llevas acumuladas. Seguimos desde aquí, no desde cero.`,
      };
    }
    return {
      icono: '🍃',
      titulo: 'Tu semana, tal como fue',
      texto: `Promediaste ${stats.minutosScrollPromedio} minutos al día. El progreso aquí se mide en patrón, no en una sola semana.`,
    };
  }

  /** Micro-celebración específica: menciona lo que hizo, no una frase de sistema. */
  private celebracion(
    stats: WeeklyStats,
    habitosCompletados: number,
    sustituciones: number,
    diferencia: number | null,
    porRed: ResumenPorRed[],
  ): { icono: string; titulo: string; texto: string } | null {
    if (habitosCompletados >= 3) {
      return {
        icono: '🎉',
        titulo: `Completaste ${habitosCompletados} actividades esta semana`,
        texto: `Fueron ${habitosCompletados} veces que el impulso se convirtió en otra cosa. Eso no lo hizo la app: lo hiciste tú.`,
      };
    }
    if (stats.porcentajeCumplimientoLimite >= 70 && stats.diasActivos >= DIAS_PARA_ACTIVO) {
      const principal = porRed[0];
      return {
        icono: '☀️',
        titulo: `Te mantuviste dentro de tu límite el ${stats.porcentajeCumplimientoLimite}% de los días`,
        texto: principal
          ? `Sobre todo en ${principal.redSocial}, donde promediaste ${principal.minutosPromedio} minutos al día. Era tu propio número, y lo sostuviste.`
          : 'Era tu propio número, y lo sostuviste.',
      };
    }
    if (diferencia !== null && diferencia <= -10) {
      return {
        icono: '🌊',
        titulo: `${Math.abs(diferencia)} minutos menos al día que la semana pasada`,
        texto: 'Ese rato volvió a ser tuyo. No es poca cosa sostener un cambio así durante siete días.',
      };
    }
    if (sustituciones > 0 && habitosCompletados > 0) {
      return {
        icono: '🌿',
        titulo: 'Elegiste otra cosa cuando pudiste no hacerlo',
        texto: `Esta semana cambiaste el scroll por una actividad ${habitosCompletados} ${habitosCompletados === 1 ? 'vez' : 'veces'}. Así se construye el patrón.`,
      };
    }
    return null;
  }
}
