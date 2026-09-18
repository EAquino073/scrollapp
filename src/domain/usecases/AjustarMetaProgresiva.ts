import type { ScrollTarget } from '../entities';
import type { ScrollRepository } from '../repositories';
import { generarId } from '../utilidades';

/** Reducción semanal sobre el promedio propio del participante. */
export const REDUCCION_SEMANAL = 0.1;
/** Suelo del límite: por debajo de esto una meta deja de ser realista y se vuelve castigo. */
export const LIMITE_MINIMO_MINUTOS = 5;

export interface PromedioPorRed {
  redSocial: string;
  promedioMinutos: number;
}

export interface MetaCreada {
  redSocial: string;
  limiteMinutosDiarios: number;
  /** Promedio propio del que salió el límite. */
  promedioAnterior: number;
}

/**
 * Crea las metas de la semana siguiente: el promedio propio de la semana que cierra
 * menos un 10 %. Corresponde a `AjustarMetaProgresiva` del diagrama de clases.
 *
 * Las metas anteriores de esas redes se desactivan, de modo que en `metasScroll` solo
 * queda activa la meta vigente por red, con su `numeroSemana`.
 * Si una red no tuvo uso medible, se le deja el suelo mínimo en lugar de un 0 imposible.
 */
export class AjustarMetaProgresiva {
  constructor(private readonly scrollRepository: ScrollRepository) {}

  async ejecutar(
    uid: string,
    semanaQueCierra: number,
    promedios: PromedioPorRed[],
  ): Promise<MetaCreada[]> {
    const semanaNueva = semanaQueCierra + 1;
    const metas = await this.scrollRepository.obtenerTodasLasMetas(uid);
    const redesMonitoreadas = Array.from(
      new Set(metas.filter(m => m.activo).map(m => m.redSocial)),
    );
    if (redesMonitoreadas.length === 0) {
      return [];
    }

    const ahora = new Date();
    const creadas: MetaCreada[] = [];

    for (const redSocial of redesMonitoreadas) {
      // Si ya existe la meta de esa semana (por un cierre anterior), no se duplica.
      if (metas.some(m => m.redSocial === redSocial && m.numeroSemana === semanaNueva)) {
        continue;
      }
      const promedio = promedios.find(p => p.redSocial === redSocial)?.promedioMinutos ?? 0;
      const calculado = Math.round(promedio * (1 - REDUCCION_SEMANAL));
      const limite = Math.max(LIMITE_MINIMO_MINUTOS, calculado);

      for (const antigua of metas.filter(m => m.redSocial === redSocial && m.activo)) {
        await this.scrollRepository.guardarMeta({ ...antigua, activo: false });
      }

      const meta: ScrollTarget = {
        targetId: generarId(),
        userId: uid,
        redSocial,
        limiteMinutosDiarios: limite,
        numeroSemana: semanaNueva,
        fechaCreacion: ahora,
        activo: true,
      };
      await this.scrollRepository.guardarMeta(meta);
      creadas.push({
        redSocial,
        limiteMinutosDiarios: limite,
        promedioAnterior: Math.round(promedio * 10) / 10,
      });
    }

    return creadas;
  }
}
