import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from '@react-native-firebase/firestore';
import type { ModoIntensidad, Usuario } from '../../domain/entities';
import type { UserRepository } from '../../domain/repositories';
import { COLECCIONES } from './colecciones';
import { db } from './firebase';
import { docAUsuario, usuarioADoc, type UsuarioDoc } from './UsuarioMapper';

/** Implementación de `UserRepository` sobre la colección `usuarios`. */
export class UsuarioFirestoreRepository implements UserRepository {
  private referencia(uid: string) {
    return doc(db, COLECCIONES.usuarios, uid);
  }

  async obtenerUsuario(uid: string): Promise<Usuario | null> {
    const snapshot = await getDoc(this.referencia(uid));
    if (!snapshot.exists()) {
      return null;
    }
    return docAUsuario(uid, snapshot.data() as Partial<UsuarioDoc>);
  }

  async guardarUsuario(usuario: Usuario): Promise<void> {
    await setDoc(this.referencia(usuario.uid), usuarioADoc(usuario));
  }

  async actualizarModoIntensidad(uid: string, modo: ModoIntensidad): Promise<void> {
    await updateDoc(this.referencia(uid), { modoIntensidad: modo });
  }

  /**
   * Comprueba si el código ya está asignado. Con las reglas actuales cada participante
   * solo puede leer su propio documento, así que la consulta se rechaza y devolvemos
   * `null` ("no se pudo comprobar"). Si en el futuro se añade una regla que permita
   * consultar `usuarios` por `codigoParticipante`, este método empieza a funcionar solo.
   */
  async existeCodigoParticipante(codigo: string): Promise<boolean | null> {
    try {
      const resultado = await getDocs(
        query(collection(db, COLECCIONES.usuarios), where('codigoParticipante', '==', codigo)),
      );
      return !resultado.empty;
    } catch (e) {
      console.warn('[ScrollApp] No se pudo verificar el código de participante', e);
      return null;
    }
  }

  async actualizarCampos(uid: string, cambios: Partial<Omit<Usuario, 'uid'>>): Promise<void> {
    const { fechaRegistro, ...resto } = cambios;
    const datos: Record<string, unknown> = { ...resto };
    if (fechaRegistro) {
      datos.fechaRegistro = Timestamp.fromDate(fechaRegistro);
    }
    await updateDoc(this.referencia(uid), datos);
  }
}
