import { collection, doc, getDocs, query, setDoc, where } from '@react-native-firebase/firestore';
import type { AppSession } from '../../domain/entities';
import type { SessionRepository } from '../../domain/repositories';
import { COLECCIONES } from './colecciones';
import { db } from './firebase';
import { docASesion, sesionADoc, type AppSessionDoc } from './SesionMapper';

/** Implementación de `SessionRepository` sobre `sesionesApp`. */
export class SesionFirestoreRepository implements SessionRepository {
  async registrarSesion(sesion: AppSession): Promise<void> {
    await setDoc(doc(db, COLECCIONES.sesionesApp, sesion.sessionId), sesionADoc(sesion));
  }

  async obtenerSesiones(uid: string): Promise<AppSession[]> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.sesionesApp), where('userId', '==', uid)),
    );
    return resultado.docs.map(d => docASesion(d.id, d.data() as Partial<AppSessionDoc>));
  }
}
