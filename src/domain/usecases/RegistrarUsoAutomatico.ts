import type { ScrollLog, ScrollTarget } from '../entities';
import type { MonitorDeUso, ScrollRepository } from '../repositories';
import { fechaISO, generarId, inicioDelDia, numeroSemanaDelEstudio } from '../utilidades';

const DIA_MS = 24 * 60 * 60 * 1000;
/** UsageStats conserva el detalle de eventos unos días; más atrás no hay datos fiables. */
const DIAS_MAXIMOS_RECUPERABLES = 7;

/**
 * Escribe en `registrosScroll` el uso diario por red social leyendo UsageStats.
 * Corresponde a `RegistrarUsoAutomatico` del diagrama de clases.
 *
 * Se ejecuta al abrir la app y al abrir el check-in, y **recupera los días anteriores**
 * que quedaron sin registro: si el participante no abre el check-in, el dato del estudio
 * no se pierde igualmente. Un día ya registrado se vuelve a escribir solo si es hoy
 * (el día sigue avanzando); los días cerrados no se tocan.
 */
export class RegistrarUsoAutomatico {
  constructor(
    private readonly monitor: MonitorDeUso,
    private readonly scrollRepository: ScrollRepository,
  ) {}

  /** Meta vigente para una red en una semana concreta (la más reciente que no la supera). */
  private metaVigente(metas: ScrollTarget[], redSocial: string, semana: number): ScrollTarget | null {
    const candidatas = metas
      .filter(meta => meta.redSocial === redSocial && meta.numeroSemana <= semana)
      .sort((a, b) => a.numeroSemana - b.numeroSemana);
    return candidatas.length > 0 ? candidatas[candidatas.length - 1] : null;
  }

  /**
   * @returns número de registros escritos o actualizados.
   */
  async ejecutar(uid: string, fechaRegistro: Date, hoy: Date = new Date()): Promise<number> {
    if (!this.monitor.consultarPermisos().accesoUso) {
      return 0;
    }

    const metas = await this.scrollRepository.obtenerTodasLasMetas(uid);
    const redes = Array.from(new Set(metas.filter(m => m.activo).map(m => m.redSocial)));
    if (redes.length === 0) {
      return 0;
    }

    const existentes = await this.scrollRepository.obtenerTodosLosLogs(uid);
    const yaRegistrado = new Map<string, ScrollLog>();
    existentes.forEach(log => yaRegistrado.set(`${log.fecha}|${log.redSocial}`, log));

    const hoyISO = fechaISO(hoy);
    const primerDia = inicioDelDia(fechaRegistro).getTime();
    const limiteAtras = inicioDelDia(new Date(hoy.getTime() - (DIAS_MAXIMOS_RECUPERABLES - 1) * DIA_MS)).getTime();
    let dia = Math.max(primerDia, limiteAtras);
    let escritos = 0;

    while (dia <= inicioDelDia(hoy).getTime()) {
      const inicio = new Date(dia);
      const fin = new Date(Math.min(dia + DIA_MS, hoy.getTime()));
      const fecha = fechaISO(inicio);
      const semana = numeroSemanaDelEstudio(fechaRegistro, inicio);

      const faltantes = redes.filter(red => fecha === hoyISO || !yaRegistrado.has(`${fecha}|${red}`));
      if (faltantes.length > 0) {
        const usos = await this.monitor.obtenerUsoPorRedSocial(inicio, fin, faltantes);
        for (const uso of usos) {
          const meta = this.metaVigente(metas, uso.redSocial, semana);
          const limite = meta?.limiteMinutosDiarios ?? 0;
          const minutos = Math.round(uso.minutosEnPrimerPlano);
          const previo = yaRegistrado.get(`${fecha}|${uso.redSocial}`);
          const log: ScrollLog = {
            // Reusar el ID del registro previo del mismo día evita duplicados.
            logId: previo?.logId ?? generarId(),
            targetId: meta?.targetId ?? '',
            userId: uid,
            redSocial: uso.redSocial,
            fecha,
            minutosUsados: minutos,
            aperturas: uso.aperturas,
            // En la semana de observación (límite 0) no hay nada que incumplir.
            cumplioLimite: limite === 0 ? true : minutos <= limite,
            timestamp: new Date(),
          };
          await this.scrollRepository.registrarUso(log);
          yaRegistrado.set(`${fecha}|${uso.redSocial}`, log);
          escritos++;
        }
      }
      dia += DIA_MS;
    }
    return escritos;
  }
}
