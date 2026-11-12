import type { EstadoRotacion } from '../entities/EstadoRotacion';

/** Fuente de azar inyectable (devuelve un número en [0, 1)), para poder probar. */
export type Aleatorio = () => number;

/** Índice al azar en [0, n), a prueba de un generador que devuelva exactamente 1. */
export function indiceAleatorio(n: number, aleatorio: Aleatorio): number {
  return Math.min(n - 1, Math.floor(aleatorio() * n));
}

/** Copia barajada (Fisher-Yates). */
export function barajar<T>(lista: readonly T[], aleatorio: Aleatorio): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = indiceAleatorio(i + 1, aleatorio);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export interface ResultadoRotacion {
  id: string;
  estado: EstadoRotacion;
}

/**
 * Siguiente ID de una rotación sin repeticiones:
 * - no repite ningún ID hasta haber mostrado todos los del banco;
 * - al agotar el banco empieza una vuelta nueva (se «baraja de nuevo») y evita que el
 *   primero de la vuelta sea el último de la anterior;
 * - ignora IDs guardados que ya no existan e incorpora los nuevos a la vuelta en curso.
 */
export function siguienteEnRotacion(
  ids: readonly string[],
  estado: EstadoRotacion | null,
  aleatorio: Aleatorio,
): ResultadoRotacion {
  if (ids.length === 0) {
    throw new Error('No se puede rotar un banco vacío.');
  }
  const existentes = new Set(ids);
  let mostrados = (estado?.mostrados ?? []).filter(id => existentes.has(id));
  const vistos = new Set(mostrados);
  let restantes = ids.filter(id => !vistos.has(id));

  if (restantes.length === 0) {
    mostrados = [];
    const ultimo = estado?.ultimo ?? null;
    restantes = ids.length > 1 ? ids.filter(id => id !== ultimo) : [...ids];
  }

  const id = restantes[indiceAleatorio(restantes.length, aleatorio)];
  return { id, estado: { mostrados: [...mostrados, id], ultimo: id } };
}
