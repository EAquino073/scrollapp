import type { ContenidoPorTipo, TipoActividad } from '../entities';

/**
 * Puerto hacia el banco local de contenido guiado (extensión del diagrama, fase 5).
 * La implementación lee los JSON empaquetados en la app; no hay red ni Firestore.
 */
export interface BancoContenido {
  /** Todos los elementos del banco de una actividad, en su orden original. */
  obtenerElementos<T extends TipoActividad>(tipo: T): ContenidoPorTipo[T][];
  /** Un elemento por su ID estable, o `undefined` si no existe (p. ej. se retiró del banco). */
  obtenerPorId<T extends TipoActividad>(tipo: T, id: string): ContenidoPorTipo[T] | undefined;
}
