import type {
  ContenidoPorTipo,
  Estiramiento,
  Lectura,
  MensajeAgua,
  PatronRespiracion,
  PreguntaNota,
  RetoMental,
  RetoObservacion,
  SugerenciaCaminata,
  TipoActividad,
} from '../../domain/entities';
import type { BancoContenido } from '../../domain/repositories';
import agua from './actividades/agua.json';
import caminar from './actividades/caminar.json';
import escribir from './actividades/escribir.json';
import estirar from './actividades/estirar.json';
import leer from './actividades/leer.json';
import observar from './actividades/observar.json';
import respirar from './actividades/respirar.json';
import retoMente from './actividades/retoMente.json';

/**
 * Banco de contenido guiado empaquetado con la app. Un JSON por actividad en
 * `actividades/`, validado con `node herramientas/validarContenido.js` (estructura,
 * IDs únicos y estables, sin duplicados). Los IDs nunca se reutilizan: si un elemento
 * se retira, su número queda libre para siempre.
 */
const ELEMENTOS: { [T in TipoActividad]: ContenidoPorTipo[T][] } = {
  ESTIRAR: estirar.elementos as Estiramiento[],
  AGUA: agua.elementos as MensajeAgua[],
  RESPIRAR: respirar.elementos as PatronRespiracion[],
  ESCRIBIR: escribir.elementos as PreguntaNota[],
  CAMINAR: caminar.elementos as SugerenciaCaminata[],
  LEER: leer.elementos as Lectura[],
  OBSERVAR: observar.elementos as RetoObservacion[],
  RETO_MENTE: retoMente.elementos as RetoMental[],
};

export class BancoContenidoLocal implements BancoContenido {
  private readonly indices = new Map<string, number>();

  constructor() {
    for (const tipo of Object.keys(ELEMENTOS) as TipoActividad[]) {
      ELEMENTOS[tipo].forEach((elemento, i) => this.indices.set(`${tipo}:${elemento.id}`, i));
    }
  }

  obtenerElementos<T extends TipoActividad>(tipo: T): ContenidoPorTipo[T][] {
    return ELEMENTOS[tipo];
  }

  obtenerPorId<T extends TipoActividad>(tipo: T, id: string): ContenidoPorTipo[T] | undefined {
    const indice = this.indices.get(`${tipo}:${id}`);
    return indice === undefined ? undefined : ELEMENTOS[tipo][indice];
  }
}
