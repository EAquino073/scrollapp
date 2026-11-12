import { BancoContenidoLocal } from '../src/data/contenido/BancoContenidoLocal';
import { TIPOS_ACTIVIDAD } from '../src/domain/entities/ActividadPredeterminada';
import type { EstadoRotacion } from '../src/domain/entities/EstadoRotacion';
import type { RotacionRepository } from '../src/domain/repositories/RotacionRepository';
import { AsignarContenidoGuiado } from '../src/domain/usecases/AsignarContenidoGuiado';

class RotacionEnMemoria implements RotacionRepository {
  readonly datos = new Map<string, EstadoRotacion>();
  async obtenerEstado(uid: string, clave: string) {
    return this.datos.get(`${uid}:${clave}`) ?? null;
  }
  async guardarEstado(uid: string, clave: string, estado: EstadoRotacion) {
    this.datos.set(`${uid}:${clave}`, estado);
  }
}

describe('AsignarContenidoGuiado', () => {
  const banco = new BancoContenidoLocal();

  it.each(TIPOS_ACTIVIDAD.filter(t => t !== 'RETO_MENTE'))('recorre todo el banco de %s sin repetir', async tipo => {
    const caso = new AsignarContenidoGuiado(banco, new RotacionEnMemoria());
    const total = banco.obtenerElementos(tipo).length;
    const vistos = new Set<string>();
    for (let i = 0; i < total; i++) {
      const asignado = await caso.ejecutar('uid-1', tipo);
      expect(asignado.tipo).toBe(tipo);
      if (asignado.tipo !== 'MINIJUEGO') {
        expect(asignado.contenidoId).toBe(asignado.elemento.id);
      }
      vistos.add(asignado.contenidoId);
    }
    expect(vistos.size).toBe(total);
  });

  it('en «Un reto para la mente» alterna acertijo y minijuego, y rota los tres juegos', async () => {
    const caso = new AsignarContenidoGuiado(banco, new RotacionEnMemoria());
    const acertijos = new Set<string>();
    const juegos: string[] = [];
    const total = banco.obtenerElementos('RETO_MENTE').length;
    for (let i = 0; i < total * 2; i++) {
      const asignado = await caso.ejecutar('uid-1', 'RETO_MENTE', { gamaDispositivo: 'BAJA' });
      if (i % 2 === 0) {
        expect(asignado.tipo).toBe('RETO_MENTE');
        acertijos.add(asignado.contenidoId);
      } else {
        expect(asignado.tipo).toBe('MINIJUEGO');
        juegos.push(asignado.contenidoId);
        if (asignado.tipo === 'MINIJUEGO' && asignado.minijuego.juego === 'LABERINTO') {
          expect(asignado.minijuego.laberinto.tamano).toBe(6);
        }
      }
    }
    // Los 60 acertijos salen sin repetirse mientras los juegos se turnan.
    expect(acertijos.size).toBe(total);
    for (let i = 0; i + 3 <= juegos.length; i += 3) {
      expect(new Set(juegos.slice(i, i + 3))).toEqual(
        new Set(['juego-laberinto', 'juego-sudoku', 'juego-watersort']),
      );
    }
  });

  it('lleva una rotación independiente por usuario y por actividad', async () => {
    const rotacion = new RotacionEnMemoria();
    const caso = new AsignarContenidoGuiado(banco, rotacion);
    await caso.ejecutar('uid-1', 'LEER');
    await caso.ejecutar('uid-1', 'LEER');
    await caso.ejecutar('uid-2', 'LEER');
    await caso.ejecutar('uid-1', 'AGUA');
    expect(rotacion.datos.get('uid-1:LEER')?.mostrados).toHaveLength(2);
    expect(rotacion.datos.get('uid-2:LEER')?.mostrados).toHaveLength(1);
    expect(rotacion.datos.get('uid-1:AGUA')?.mostrados).toHaveLength(1);
  });
});
