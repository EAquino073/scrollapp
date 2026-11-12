import {
  CONTENIDO_ID_MINIJUEGO,
  TIPOS_MINIJUEGO,
  type ContenidoPorTipo,
  type MinijuegoGenerado,
  type TipoActividad,
  type TipoMinijuego,
} from '../entities';
import { generarMinijuego } from '../minijuegos';
import type { BancoContenido, RotacionRepository } from '../repositories';
import { siguienteEnRotacion, type Aleatorio } from '../utilidades';

/**
 * Contenido asignado a una sesión de actividad guiada: un elemento del banco o, en
 * «Un reto para la mente», un minijuego ya generado. `tipo` discrimina la unión, así que
 * la pantalla sabe qué forma tiene cada caso. `contenidoId` va a `HabitLog`.
 */
export type ContenidoAsignado =
  | {
      [T in TipoActividad]: { tipo: T; elemento: ContenidoPorTipo[T]; contenidoId: string };
    }[TipoActividad]
  | { tipo: 'MINIJUEGO'; minijuego: MinijuegoGenerado; contenidoId: string };

/** Contenido asignado que viene del banco (todo salvo los minijuegos). */
export type ContenidoDelBanco = Exclude<ContenidoAsignado, { tipo: 'MINIJUEGO' }>;

/** Minijuego asignado. */
export type MinijuegoAsignado = Extract<ContenidoAsignado, { tipo: 'MINIJUEGO' }>;

export interface OpcionesAsignacion {
  /** Gama del dispositivo (`BAJA`, `MEDIA`, `ALTA`); ajusta el tamaño del laberinto. */
  gamaDispositivo?: string | null;
}

/** Claves de rotación propias de «Un reto para la mente». */
const CLAVE_TURNO_RETO = 'RETO_MENTE:turno';
const CLAVE_MINIJUEGOS = 'MINIJUEGO';
const TURNO_ACERTIJO = 'ACERTIJO';
const TURNO_MINIJUEGO = 'MINIJUEGO';

/**
 * Elige el contenido de una actividad predeterminada con una rotación sin repeticiones
 * por usuario y actividad: no repite hasta agotar el banco y luego vuelve a barajar.
 * En «Un reto para la mente» se alterna una vez un acertijo del banco y otra un minijuego;
 * los tres minijuegos también rotan entre sí. El contenido cuenta como mostrado en cuanto
 * se asigna, aunque la actividad no se termine.
 */
export class AsignarContenidoGuiado {
  constructor(
    private readonly banco: BancoContenido,
    private readonly rotacion: RotacionRepository,
    private readonly aleatorio: Aleatorio = Math.random,
  ) {}

  async ejecutar(uid: string, tipo: TipoActividad, opciones: OpcionesAsignacion = {}): Promise<ContenidoAsignado> {
    if (tipo === 'RETO_MENTE' && (await this.tocaMinijuego(uid))) {
      return this.siguienteMinijuego(uid, opciones.gamaDispositivo);
    }
    return this.siguienteDelBanco(uid, tipo);
  }

  /** Alterna el turno: la primera vez un acertijo, la siguiente un minijuego, y así. */
  private async tocaMinijuego(uid: string): Promise<boolean> {
    const turno = await this.rotacion.obtenerEstado(uid, CLAVE_TURNO_RETO);
    const toca = turno?.ultimo === TURNO_ACERTIJO;
    await this.rotacion.guardarEstado(uid, CLAVE_TURNO_RETO, {
      mostrados: [],
      ultimo: toca ? TURNO_MINIJUEGO : TURNO_ACERTIJO,
    });
    return toca;
  }

  private async siguienteMinijuego(uid: string, gamaDispositivo?: string | null): Promise<ContenidoAsignado> {
    const estado = await this.rotacion.obtenerEstado(uid, CLAVE_MINIJUEGOS);
    const siguiente = siguienteEnRotacion(TIPOS_MINIJUEGO, estado, this.aleatorio);
    await this.rotacion.guardarEstado(uid, CLAVE_MINIJUEGOS, siguiente.estado);
    const juego = siguiente.id as TipoMinijuego;
    return {
      tipo: 'MINIJUEGO',
      minijuego: generarMinijuego(juego, gamaDispositivo, this.aleatorio),
      contenidoId: CONTENIDO_ID_MINIJUEGO[juego],
    };
  }

  private async siguienteDelBanco<T extends TipoActividad>(uid: string, tipo: T): Promise<ContenidoAsignado> {
    const elementos = this.banco.obtenerElementos(tipo);
    const estado = await this.rotacion.obtenerEstado(uid, tipo);
    const siguiente = siguienteEnRotacion(
      elementos.map(e => e.id),
      estado,
      this.aleatorio,
    );
    await this.rotacion.guardarEstado(uid, tipo, siguiente.estado);
    const elemento = this.banco.obtenerPorId(tipo, siguiente.id);
    if (!elemento) {
      throw new Error(`El contenido ${siguiente.id} no está en el banco de ${tipo}.`);
    }
    // TypeScript no correlaciona el genérico con la unión; la forma es la correcta.
    return { tipo, elemento, contenidoId: siguiente.id } as ContenidoAsignado;
  }
}
