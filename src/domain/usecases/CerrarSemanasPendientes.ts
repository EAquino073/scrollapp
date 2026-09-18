import type { Usuario } from '../entities';
import type { StatsRepository } from '../repositories';
import { numeroSemanaDelEstudio } from '../utilidades';
import { AjustarMetaProgresiva, type MetaCreada, type PromedioPorRed } from './AjustarMetaProgresiva';
import { CalcularLineaBase } from './CalcularLineaBase';
import { GenerarRevisionSemanal } from './GenerarRevisionSemanal';
import { GestionarRecordatorios } from './GestionarRecordatorios';
import { RegistrarUsoAutomatico } from './RegistrarUsoAutomatico';

export interface SemanaCerrada {
  numeroSemana: number;
  esSemanaDeObservacion: boolean;
  metasCreadas: MetaCreada[];
  /** Solo en el cierre de la semana 1. */
  baselineMinutos: number | null;
}

/**
 * Cierra todas las semanas que ya terminaron y aún no tienen `WeeklyStats`.
 *
 * Por cada semana cerrada: guarda las estadísticas, calcula el promedio propio y crea las
 * metas de la semana siguiente (−10 %). En el cierre de la **semana 1** el promedio sale de
 * `CalcularLineaBase` y además se guarda en `tiempoUsoDiarioBaseline`; de la semana 2 en
 * adelante sale de los `registrosScroll` de la semana que cierra.
 *
 * Se invoca al abrir la app; no depende de que el participante abra ninguna pantalla.
 */
export class CerrarSemanasPendientes {
  /**
   * Varias pantallas piden cerrar semanas al abrirse (Hoy, Progreso, Revisión). Se comparte
   * la misma ejecución en curso para no duplicar estadísticas ni metas.
   */
  private enCurso: Promise<SemanaCerrada[]> | null = null;

  constructor(
    private readonly statsRepository: StatsRepository,
    private readonly generarRevisionSemanal: GenerarRevisionSemanal,
    private readonly ajustarMetaProgresiva: AjustarMetaProgresiva,
    private readonly calcularLineaBase: CalcularLineaBase,
    private readonly registrarUsoAutomatico: RegistrarUsoAutomatico,
    private readonly recordatorios: GestionarRecordatorios,
  ) {}

  ejecutar(usuario: Usuario, hoy: Date = new Date()): Promise<SemanaCerrada[]> {
    if (this.enCurso) {
      return this.enCurso;
    }
    this.enCurso = this.cerrar(usuario, hoy).finally(() => {
      this.enCurso = null;
    });
    return this.enCurso;
  }

  private async cerrar(usuario: Usuario, hoy: Date): Promise<SemanaCerrada[]> {
    if (!usuario.onboardingCompletado) {
      return [];
    }
    const semanaActual = numeroSemanaDelEstudio(usuario.fechaRegistro, hoy);
    if (semanaActual <= 1) {
      return [];
    }

    // Asegura que los últimos días estén registrados antes de promediar.
    await this.registrarUsoAutomatico.ejecutar(usuario.uid, usuario.fechaRegistro, hoy);

    const historial = await this.statsRepository.obtenerHistorial(usuario.uid);
    const cerradas: SemanaCerrada[] = [];

    for (let semana = 1; semana < semanaActual; semana++) {
      if (historial.some(s => s.numeroSemana === semana)) {
        continue;
      }
      const revision = await this.generarRevisionSemanal.ejecutar(usuario, semana);

      let promedios: PromedioPorRed[];
      let baselineMinutos: number | null = null;
      if (semana === 1) {
        const lineaBase = await this.calcularLineaBase.ejecutar(usuario.uid, usuario.fechaRegistro, hoy);
        await this.calcularLineaBase.guardar(usuario.uid, lineaBase);
        baselineMinutos = lineaBase.promedioMinutosTotal;
        promedios = lineaBase.porRed.map(r => ({
          redSocial: r.redSocial,
          promedioMinutos: r.promedioMinutos,
        }));
      } else {
        promedios = revision.porRed.map(r => ({
          redSocial: r.redSocial,
          promedioMinutos: r.minutosPromedio,
        }));
      }

      const metasCreadas = await this.ajustarMetaProgresiva.ejecutar(usuario.uid, semana, promedios);
      cerradas.push({
        numeroSemana: semana,
        esSemanaDeObservacion: semana === 1,
        metasCreadas,
        baselineMinutos,
      });
    }

    if (cerradas.length > 0) {
      try {
        this.recordatorios.avisarRevisionSemanal(cerradas[cerradas.length - 1].numeroSemana);
      } catch (e) {
        console.warn('[ScrollApp] No se pudo avisar de la revisión semanal', e);
      }
    }
    return cerradas;
  }
}
