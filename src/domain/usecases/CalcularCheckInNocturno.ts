import { DecisionFriccion, type DailyReflection, type Usuario } from '../entities';
import type { HabitRepository, ReflectionRepository, ScrollRepository } from '../repositories';
import { fechaISO, numeroSemanaDelEstudio } from '../utilidades';
import { RegistrarUsoAutomatico } from './RegistrarUsoAutomatico';

export interface UsoDelDia {
  redSocial: string;
  minutosUsados: number;
  aperturas: number;
  /** Límite del día, 0 si la semana es de observación. */
  limiteMinutos: number;
  cumplioLimite: boolean;
}

export interface CheckInNocturno {
  fecha: string;
  numeroSemana: number;
  esSemanaDeObservacion: boolean;
  porRed: UsoDelDia[];
  minutosTotales: number;
  aperturasTotales: number;
  /** Veces que hoy eligió una actividad en lugar de continuar. */
  sustituciones: number;
  /** Veces que hoy eligió continuar. */
  continuaciones: number;
  /** Actividades completadas hoy. */
  habitosCumplidos: number;
  /** Límite total del día sumando redes; 0 si aún no hay metas. */
  limiteTotal: number;
  cumplioTodosLosLimites: boolean;
  /** Reflexión ya escrita hoy, si existe. */
  reflexionDeHoy: DailyReflection | null;
  mensaje: { titulo: string; texto: string; icono: string };
}

/**
 * Resumen del día para el check-in nocturno. Corresponde a `CalcularCheckInNocturno`
 * del diagrama de clases.
 *
 * Antes de calcular fuerza el registro automático del uso, para que el dato del estudio
 * quede escrito aunque el participante no abra la app más tarde.
 */
export class CalcularCheckInNocturno {
  constructor(
    private readonly scrollRepository: ScrollRepository,
    private readonly habitRepository: HabitRepository,
    private readonly reflectionRepository: ReflectionRepository,
    private readonly registrarUsoAutomatico: RegistrarUsoAutomatico,
  ) {}

  async ejecutar(usuario: Usuario, hoy: Date = new Date()): Promise<CheckInNocturno> {
    const fecha = fechaISO(hoy);
    const numeroSemana = numeroSemanaDelEstudio(usuario.fechaRegistro, hoy);

    await this.registrarUsoAutomatico.ejecutar(usuario.uid, usuario.fechaRegistro, hoy);

    const [logs, metas, eventos, reflexiones, habitosActivos] = await Promise.all([
      this.scrollRepository.obtenerTodosLosLogs(usuario.uid),
      this.scrollRepository.obtenerTodasLasMetas(usuario.uid),
      this.scrollRepository.obtenerEventosFriccionPorDia(usuario.uid, fecha),
      this.reflectionRepository.obtenerReflexiones(usuario.uid),
      this.habitRepository.obtenerHabitosActivos(usuario.uid),
    ]);
    const logsHabitos = await this.habitRepository.obtenerLogsPorSemana(usuario.uid, numeroSemana);

    const logsDeHoy = logs.filter(log => log.fecha === fecha);
    const porRed: UsoDelDia[] = logsDeHoy.map(log => {
      const meta = metas
        .filter(m => m.redSocial === log.redSocial && m.numeroSemana <= numeroSemana)
        .sort((a, b) => a.numeroSemana - b.numeroSemana)
        .pop();
      const limite = meta?.limiteMinutosDiarios ?? 0;
      return {
        redSocial: log.redSocial,
        minutosUsados: log.minutosUsados,
        aperturas: log.aperturas,
        limiteMinutos: limite,
        cumplioLimite: limite === 0 ? true : log.minutosUsados <= limite,
      };
    });
    porRed.sort((a, b) => b.minutosUsados - a.minutosUsados);

    const minutosTotales = porRed.reduce((suma, r) => suma + r.minutosUsados, 0);
    const aperturasTotales = porRed.reduce((suma, r) => suma + r.aperturas, 0);
    const limiteTotal = porRed.reduce((suma, r) => suma + r.limiteMinutos, 0);
    const sustituciones = eventos.filter(e => e.decision === DecisionFriccion.SUSTITUIR).length;
    const continuaciones = eventos.filter(e => e.decision === DecisionFriccion.CONTINUAR).length;
    const habitosCumplidos = logsHabitos.filter(log => log.fecha === fecha && log.cumplido).length;
    const conMeta = porRed.filter(r => r.limiteMinutos > 0);
    const cumplioTodosLosLimites = conMeta.length > 0 && conMeta.every(r => r.cumplioLimite);

    return {
      fecha,
      numeroSemana,
      esSemanaDeObservacion: numeroSemana === 1,
      porRed,
      minutosTotales,
      aperturasTotales,
      sustituciones,
      continuaciones,
      habitosCumplidos,
      limiteTotal,
      cumplioTodosLosLimites,
      reflexionDeHoy: reflexiones.find(r => r.fecha === fecha) ?? null,
      mensaje: this.mensajeDelDia({
        numeroSemana,
        minutosTotales,
        sustituciones,
        habitosCumplidos,
        cumplioTodosLosLimites,
        tieneMetas: conMeta.length > 0,
        actividadesDisponibles: habitosActivos.length,
      }),
    };
  }

  /**
   * Mensaje cálido acorde al día. Nunca culpa: si el día fue largo, se nombra sin juicio
   * y se recuerda que el progreso es un patrón, no un día suelto.
   */
  private mensajeDelDia(datos: {
    numeroSemana: number;
    minutosTotales: number;
    sustituciones: number;
    habitosCumplidos: number;
    cumplioTodosLosLimites: boolean;
    tieneMetas: boolean;
    actividadesDisponibles: number;
  }): { titulo: string; texto: string; icono: string } {
    if (datos.habitosCumplidos > 0) {
      return {
        icono: '🌿',
        titulo: `Hoy elegiste otra cosa ${datos.habitosCumplidos} ${datos.habitosCumplidos === 1 ? 'vez' : 'veces'}`,
        texto: 'Cada vez que cambias el impulso por una actividad, el camino se vuelve un poco más tuyo.',
      };
    }
    if (datos.sustituciones > 0) {
      return {
        icono: '🍃',
        titulo: 'Hoy hiciste una pausa distinta',
        texto: 'Elegiste una alternativa aunque no la terminaras. Notar el impulso ya es parte del cambio.',
      };
    }
    if (datos.tieneMetas && datos.cumplioTodosLosLimites) {
      return {
        icono: '☀️',
        titulo: 'Te mantuviste dentro de tu propio límite',
        texto: 'No era un número ajeno: era el que salió de tu ritmo. Hoy te quedaste ahí.',
      };
    }
    if (datos.numeroSemana === 1) {
      return {
        icono: '🌱',
        titulo: 'Seguimos conociendo tu ritmo',
        texto: 'Esta semana no hay nada que cumplir. Solo estamos viendo cómo son tus días de verdad.',
      };
    }
    if (datos.minutosTotales > 0) {
      return {
        icono: '🌤️',
        titulo: 'Hoy fue un día como fue',
        texto: 'Un día largo no borra lo que llevas acumulado. Mañana sigue el mismo camino, sin empezar de cero.',
      };
    }
    return {
      icono: '🌙',
      titulo: 'Un día tranquilo',
      texto: 'Casi no hubo scroll hoy. A veces el día simplemente se va en otras cosas, y está bien.',
    };
  }
}
