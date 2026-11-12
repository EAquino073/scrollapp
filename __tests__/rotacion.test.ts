import { barajar, siguienteEnRotacion } from '../src/domain/utilidades/rotacion';
import type { EstadoRotacion } from '../src/domain/entities/EstadoRotacion';

/* eslint-disable no-bitwise -- mulberry32 necesita operaciones de bits */
/** Generador pseudoaleatorio determinista (mulberry32) para pruebas reproducibles. */
function semilla(valor: number): () => number {
  let a = valor >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const IDS = Array.from({ length: 12 }, (_, i) => `leer-${String(i + 1).padStart(3, '0')}`);

function sacar(ids: string[], veces: number, estadoInicial: EstadoRotacion | null, aleatorio: () => number) {
  let estado = estadoInicial;
  const salida: string[] = [];
  for (let i = 0; i < veces; i++) {
    const r = siguienteEnRotacion(ids, estado, aleatorio);
    salida.push(r.id);
    estado = r.estado;
  }
  return { salida, estado };
}

describe('siguienteEnRotacion', () => {
  it('no repite hasta agotar el banco', () => {
    const { salida } = sacar(IDS, IDS.length, null, semilla(1));
    expect(new Set(salida).size).toBe(IDS.length);
  });

  it('vuelve a barajar al terminar la vuelta y no repite el último enseguida', () => {
    for (let s = 1; s <= 50; s++) {
      const { salida } = sacar(IDS, IDS.length * 3, null, semilla(s));
      for (let vuelta = 0; vuelta < 3; vuelta++) {
        const tramo = salida.slice(vuelta * IDS.length, (vuelta + 1) * IDS.length);
        expect(new Set(tramo).size).toBe(IDS.length);
      }
      for (let i = 1; i < salida.length; i++) {
        expect(salida[i]).not.toBe(salida[i - 1]);
      }
    }
  });

  it('el orden cambia entre vueltas', () => {
    const { salida } = sacar(IDS, IDS.length * 2, null, semilla(7));
    expect(salida.slice(0, IDS.length)).not.toEqual(salida.slice(IDS.length));
  });

  it('ignora IDs retirados del banco e incorpora los nuevos a la vuelta en curso', () => {
    const estado: EstadoRotacion = { mostrados: ['leer-001', 'leer-002', 'leer-099'], ultimo: 'leer-099' };
    const banco = [...IDS, 'leer-013'];
    const { salida } = sacar(banco, banco.length - 2, estado, semilla(3));
    expect(salida).not.toContain('leer-001');
    expect(salida).not.toContain('leer-002');
    expect(salida).toContain('leer-013');
    expect(new Set(salida).size).toBe(banco.length - 2);
  });

  it('funciona con un banco de un solo elemento', () => {
    const { salida } = sacar(['agua-001'], 3, null, semilla(5));
    expect(salida).toEqual(['agua-001', 'agua-001', 'agua-001']);
  });

  it('tolera un generador que devuelve exactamente 1', () => {
    expect(() => siguienteEnRotacion(IDS, null, () => 1)).not.toThrow();
    expect(IDS).toContain(siguienteEnRotacion(IDS, null, () => 1).id);
  });

  it('rechaza un banco vacío', () => {
    expect(() => siguienteEnRotacion([], null, Math.random)).toThrow();
  });
});

describe('barajar', () => {
  it('conserva los elementos', () => {
    expect([...barajar(IDS, semilla(9))].sort()).toEqual([...IDS].sort());
  });
});
