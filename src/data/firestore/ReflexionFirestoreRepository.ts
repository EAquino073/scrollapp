import { collection, doc, getDocs, query, setDoc, where } from '@react-native-firebase/firestore';
import type { DailyReflection } from '../../domain/entities';
import type { ReflectionRepository } from '../../domain/repositories';
import { COLECCIONES } from './colecciones';
import { db } from './firebase';
import { docAReflexion, reflexionADoc, type DailyReflectionDoc } from './ReflexionMapper';

/** Implementación de `ReflectionRepository` sobre `reflexionesDiarias`. */
export class ReflexionFirestoreRepository implements ReflectionRepository {
  async guardarReflexion(reflexion: DailyReflection): Promise<void> {
    await setDoc(doc(db, COLECCIONES.reflexionesDiarias, reflexion.reflexionId), reflexionADoc(reflexion));
  }

  async obtenerReflexiones(uid: string): Promise<DailyReflection[]> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.reflexionesDiarias), where('userId', '==', uid)),
    );
    return resultado.docs
      .map(d => docAReflexion(d.id, d.data() as Partial<DailyReflectionDoc>))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }
}
