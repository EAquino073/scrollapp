import type { MonitorDeUso, ScrollRepository, UserRepository } from '../repositories';
import { fechaISO, inicioDelDia, rangoDeSemana } from '../utilidades';

const DIA_MS = 24 * 60 * 60 * 1000;

export interface LineaBasePorRed {
  redSocial: string;
  promedioMinutos: number;
  promedioAperturas: number;
}

export interface LineaBase {
  /** Días de la semana 1 que se contabilizaron (hasta 7). */
  diasContados: number;
  porRed: LineaBasePorRed[];
  /** Suma de los promedios diarios de todas las redes monitoreadas. */
  promedioMinutosTotal: number;
  promedioAperturasTotal: number;
}

/**
 * Línea base propia del participante: promedio diario de minutos y aperturas por red
 * durante la semana 1. Corresponde a `CalcularLineaBase` del diagrama de clases.
 *
 * Fuente de datos: se prefiere lo ya escrito en `registrosScroll` (que se guardó día a día
 * desde UsageStats y no caduca) y solo se consulta UsageStats para los días que falten.
 * Así la línea base sigue siendo correcta aunque el cierre de la semana ocurra tarde,
 * cuando el historial de eventos de Android ya no llega tan atrás.
 *
 * `guardar` persiste el total en `tiempoUsoDiarioBaseline`; a partir de ahí las metas
 * progresivas se calculan como −10 % semanal sobre el promedio propio.
 */
export class CalcularLineaBase {
  constructor(
    private readonly monitor: MonitorDeUso,
    private readonly scrollRepository: ScrollRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async ejecutar(uid: string, fechaRegistro: Date, hoy: Date = new Date()): Promise<LineaBase> {
    const metas = await this.scrollRepository.obtenerTodasLasMetas(uid);
    const redes = Array.from(new Set(metas.map(meta => meta.redSocial)));
    if (redes.length === 0) {
      return { diasContados: 0, porRed: [], promedioMinutosTotal: 0, promedioAperturasTotal: 0 };
    }

    const rango = rangoDeSemana(fechaRegistro, 1);
    const logs = (await this.scrollRepository.obtenerTodosLosLogs(uid)).filter(
      log => log.fecha >= rango.desde && log.fecha <= rango.hasta,
    );
    const registrado = new Map<string, { minutos: number; aperturas: number }>();
    logs.forEach(log => registrado.set(`${log.fecha}|${log.redSocial}`, {
      minutos: log.minutosUsados,
      aperturas: log.aperturas,
    }));

    const acumulado = new Map<string, { minutos: number; aperturas: number }>();
    redes.forEach(red => acumulado.set(red, { minutos: 0, aperturas: 0 }));

    const inicioSemana = inicioDelDia(fechaRegistro);
    const finSemana = new Date(inicioSemana.getTime() + 7 * DIA_MS);
    const limite = hoy < finSemana ? hoy : finSemana;
    const diasConDatos = new Set<string>();
    const puedeConsultarUso = this.monitor.consultarPermisos().accesoUso;

    for (let dia = new Date(inicioSemana); dia < limite; dia = new Date(dia.getTime() + DIA_MS)) {
      const fecha = fechaISO(dia);
      const finDia = new Date(Math.min(dia.getTime() + DIA_MS, limite.getTime()));
      const sinRegistro = redes.filter(red => !registrado.has(`${fecha}|${red}`));

      // Días ya persistidos: se usan tal cual.
      for (const red of redes) {
        const dato = registrado.get(`${fecha}|${red}`);
        if (dato) {
          const total = acumulado.get(red);
          if (total) {
            total.minutos += dato.minutos;
            total.aperturas += dato.aperturas;
          }
          diasConDatos.add(fecha);
        }
      }

      // Días sin registro: se intenta recuperarlos de UsageStats.
      if (sinRegistro.length > 0 && puedeConsultarUso) {
        try {
          const usos = await this.monitor.obtenerUsoPorRedSocial(dia, finDia, sinRegistro);
          for (const uso of usos) {
            const total = acumulado.get(uso.redSocial);
            if (total) {
              total.minutos += uso.minutosEnPrimerPlano;
              total.aperturas += uso.aperturas;
            }
            if (uso.minutosEnPrimerPlano > 0 || uso.aperturas > 0) {
              diasConDatos.add(fecha);
            }
          }
        } catch (e) {
          console.warn('[ScrollApp] No se pudo leer UsageStats para la línea base', e);
        }
      }
    }

    const divisor = Math.max(1, diasConDatos.size);
    const porRed: LineaBasePorRed[] = redes.map(redSocial => {
      const total = acumulado.get(redSocial) ?? { minutos: 0, aperturas: 0 };
      return {
        redSocial,
        promedioMinutos: Math.round((total.minutos / divisor) * 10) / 10,
        promedioAperturas: Math.round((total.aperturas / divisor) * 10) / 10,
      };
    });

    return {
      diasContados: diasConDatos.size,
      porRed,
      promedioMinutosTotal: Math.round(porRed.reduce((suma, r) => suma + r.promedioMinutos, 0)),
      promedioAperturasTotal: Math.round(porRed.reduce((suma, r) => suma + r.promedioAperturas, 0)),
    };
  }

  /** Guarda el promedio diario total en el perfil (`tiempoUsoDiarioBaseline`). */
  async guardar(uid: string, lineaBase: LineaBase): Promise<void> {
    await this.userRepository.actualizarCampos(uid, {
      tiempoUsoDiarioBaseline: lineaBase.promedioMinutosTotal,
    });
  }
}
