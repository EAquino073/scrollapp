import { doc, getDoc } from '@react-native-firebase/firestore';
import { rangoDeSemana } from '../../domain/utilidades';
import { COLECCIONES } from './colecciones';
import { db } from './firebase';
import type { UsuarioDoc } from './UsuarioMapper';

/**
 * Rango de fechas ISO de una semana del estudio para un participante.
 * Lee `fechaRegistro` de `usuarios/{uid}` porque el ER no guarda `numeroSemana` en los registros.
 */
export async function rangoDeSemanaDelUsuario(
  uid: string,
  numeroSemana: number,
): Promise<{ desde: string; hasta: string }> {
  const snapshot = await getDoc(doc(db, COLECCIONES.usuarios, uid));
  const data = (snapshot.data() ?? {}) as Partial<UsuarioDoc>;
  const fechaRegistro = data.fechaRegistro?.toDate() ?? new Date();
  return rangoDeSemana(fechaRegistro, numeroSemana);
}

/** Filtro en cliente por rango de fecha ISO (evita índices compuestos en Firestore). */
export function dentroDelRango(fecha: string, rango: { desde: string; hasta: string }): boolean {
  return fecha >= rango.desde && fecha <= rango.hasta;
}
