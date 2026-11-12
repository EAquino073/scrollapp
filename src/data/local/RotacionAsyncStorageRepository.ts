import { createAsyncStorage, type AsyncStorage } from '@react-native-async-storage/async-storage';
import type { EstadoRotacion } from '../../domain/entities';
import type { RotacionRepository } from '../../domain/repositories';

/** Base de datos local propia de ScrollApp (API de almacenes con nombre de AsyncStorage v3). */
const NOMBRE_ALMACEN = 'scrollapp';

function claveDe(uid: string, clave: string): string {
  return `rotacion:${uid}:${clave}`;
}

function esEstadoRotacion(valor: unknown): valor is EstadoRotacion {
  if (typeof valor !== 'object' || valor === null) {
    return false;
  }
  const { mostrados, ultimo } = valor as Record<string, unknown>;
  return (
    Array.isArray(mostrados) &&
    mostrados.every(id => typeof id === 'string') &&
    (ultimo === null || typeof ultimo === 'string')
  );
}

/**
 * Guarda el estado de rotación en el dispositivo, por usuario y clave. Si AsyncStorage
 * falla (almacenamiento lleno, módulo no disponible), la rotación sigue funcionando en
 * memoria durante la sesión: en el peor caso se repite antes algún contenido, nunca
 * se bloquea la actividad.
 */
export class RotacionAsyncStorageRepository implements RotacionRepository {
  private almacen: AsyncStorage | null = null;
  private readonly memoria = new Map<string, EstadoRotacion>();

  private obtenerAlmacen(): AsyncStorage {
    if (!this.almacen) {
      this.almacen = createAsyncStorage(NOMBRE_ALMACEN);
    }
    return this.almacen;
  }

  async obtenerEstado(uid: string, clave: string): Promise<EstadoRotacion | null> {
    const llave = claveDe(uid, clave);
    // En la misma sesión, la copia en memoria es igual o más reciente que la del disco.
    const enMemoria = this.memoria.get(llave);
    if (enMemoria) {
      return enMemoria;
    }
    try {
      const guardado = await this.obtenerAlmacen().getItem(llave);
      if (guardado !== null) {
        const estado: unknown = JSON.parse(guardado);
        if (esEstadoRotacion(estado)) {
          this.memoria.set(llave, estado);
          return estado;
        }
      }
    } catch (e) {
      console.warn('[ScrollApp] No se pudo leer la rotación de contenido', e);
    }
    return null;
  }

  async guardarEstado(uid: string, clave: string, estado: EstadoRotacion): Promise<void> {
    const llave = claveDe(uid, clave);
    this.memoria.set(llave, estado);
    try {
      await this.obtenerAlmacen().setItem(llave, JSON.stringify(estado));
    } catch (e) {
      console.warn('[ScrollApp] No se pudo guardar la rotación de contenido', e);
    }
  }
}
