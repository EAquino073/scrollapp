import type { Usuario } from '../entities';
import type { MonitorDeUso } from '../repositories';

/** De dónde sale el mensaje que se muestra en la pausa. */
export type TipoMensajeFriccion = 'MOTIVACION' | 'PAUSA' | 'DATO';

export interface MensajeFriccion {
  tipo: TipoMensajeFriccion;
  texto: string;
  /** Línea secundaria, más pequeña. Puede faltar. */
  apoyo?: string;
}

/**
 * Pesos de la rotación. La motivación personal pesa más porque es la voz del propio
 * usuario; el dato del día es el menos frecuente para que no se sienta un marcador.
 */
const PESO_MOTIVACION = 5;
const PESO_PAUSA = 3;
const PESO_DATO = 2;

const ENTRADAS_MOTIVACION = [
  'Tú lo dijiste:',
  'Con tus palabras:',
  'Lo escribiste tú:',
  'Tu porqué, tal como lo dejaste:',
];

/**
 * Arma el mensaje de la pausa de fricción. Nunca confronta ni pregunta directamente:
 * - MOTIVACION: cita el "por qué" del usuario como algo suyo.
 * - PAUSA: una frase suave del banco local, sin exigir respuesta.
 * - DATO: un número propio, sin juicio ("Hoy llevas 34 minutos aquí. Tú decides.").
 *
 * Si falta la materia prima (sin motivación escrita, o sin uso registrado hoy),
 * el tipo correspondiente se descarta y la rotación sigue con los demás.
 */
export class GenerarMensajeFriccion {
  private ultimoTipo: TipoMensajeFriccion | null = null;
  private ultimaFrase: string | null = null;

  constructor(
    private readonly monitor: MonitorDeUso,
    private readonly frasesPausa: string[],
  ) {}

  async ejecutar(usuario: Usuario | null, redSocial: string): Promise<MensajeFriccion> {
    const minutosHoy = await this.minutosDeHoy(redSocial);
    const motivacion = usuario?.motivacionPersonal?.trim() ?? '';

    const candidatos: Array<{ tipo: TipoMensajeFriccion; peso: number }> = [];
    if (motivacion.length > 0) {
      candidatos.push({ tipo: 'MOTIVACION', peso: PESO_MOTIVACION });
    }
    candidatos.push({ tipo: 'PAUSA', peso: PESO_PAUSA });
    if (minutosHoy !== null && minutosHoy >= 1) {
      candidatos.push({ tipo: 'DATO', peso: PESO_DATO });
    }

    const tipo = this.elegirTipo(candidatos);
    this.ultimoTipo = tipo;

    switch (tipo) {
      case 'MOTIVACION':
        return {
          tipo,
          texto: `${this.elegir(ENTRADAS_MOTIVACION)} «${this.comoCita(motivacion)}»`,
          apoyo: `${redSocial} seguirá ahí. Tú decides.`,
        };
      case 'DATO':
        return {
          tipo,
          texto: `Hoy llevas ${Math.round(minutosHoy ?? 0)} minutos en ${redSocial}. Tú decides.`,
          apoyo: 'Es solo un dato tuyo, no una nota ni una meta.',
        };
      default:
        return { tipo: 'PAUSA', texto: this.fraseNueva(), apoyo: 'Puedes seguir cuando quieras.' };
    }
  }

  /** Minutos de hoy en esa red, o `null` si no se puede consultar. */
  private async minutosDeHoy(redSocial: string): Promise<number | null> {
    try {
      if (!this.monitor.consultarPermisos().accesoUso) {
        return null;
      }
      const usos = await this.monitor.obtenerUsoDelDia([redSocial]);
      const uso = usos.find(u => u.redSocial === redSocial);
      return uso ? uso.minutosEnPrimerPlano : null;
    } catch (e) {
      console.warn('[ScrollApp] No se pudo leer el uso del día para el mensaje', e);
      return null;
    }
  }

  /** Elige por peso, evitando repetir el mismo tipo dos veces seguidas si hay alternativa. */
  private elegirTipo(candidatos: Array<{ tipo: TipoMensajeFriccion; peso: number }>): TipoMensajeFriccion {
    const disponibles =
      candidatos.length > 1 ? candidatos.filter(c => c.tipo !== this.ultimoTipo) : candidatos;
    const lista = disponibles.length > 0 ? disponibles : candidatos;
    const total = lista.reduce((suma, c) => suma + c.peso, 0);
    let punto = Math.random() * total;
    for (const candidato of lista) {
      punto -= candidato.peso;
      if (punto <= 0) {
        return candidato.tipo;
      }
    }
    return lista[lista.length - 1].tipo;
  }

  private fraseNueva(): string {
    if (this.frasesPausa.length === 0) {
      return 'Un segundo de calma antes de la pantalla.';
    }
    const opciones =
      this.frasesPausa.length > 1 ? this.frasesPausa.filter(f => f !== this.ultimaFrase) : this.frasesPausa;
    const frase = this.elegir(opciones);
    this.ultimaFrase = frase;
    return frase;
  }

  private elegir<T>(opciones: T[]): T {
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  /** Deja la motivación como cita: sin punto final y con minúscula inicial si procede. */
  private comoCita(texto: string): string {
    const sinPunto = texto.replace(/[.\s]+$/u, '');
    if (sinPunto.length === 0) {
      return sinPunto;
    }
    const segunda = sinPunto.charAt(1);
    // No tocar siglas ni nombres propios escritos todo en mayúscula.
    if (segunda && segunda === segunda.toUpperCase() && segunda !== segunda.toLowerCase()) {
      return sinPunto;
    }
    return sinPunto.charAt(0).toLowerCase() + sinPunto.slice(1);
  }
}
