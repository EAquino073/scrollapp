import { collection, doc, getDocs, query, setDoc, where } from '@react-native-firebase/firestore';
import type { SurveyResponse } from '../../domain/entities';
import type { SurveyRepository } from '../../domain/repositories';
import { COLECCIONES } from './colecciones';
import { docARespuesta, respuestaADoc, type SurveyResponseDoc } from './EncuestaMapper';
import { db } from './firebase';

/** Implementación de `SurveyRepository` sobre `respuestasEncuesta`. */
export class EncuestaFirestoreRepository implements SurveyRepository {
  async guardarRespuesta(respuesta: SurveyResponse): Promise<void> {
    await setDoc(doc(db, COLECCIONES.respuestasEncuesta, respuesta.responseId), respuestaADoc(respuesta));
  }

  async obtenerRespuesta(uid: string): Promise<SurveyResponse | null> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.respuestasEncuesta), where('userId', '==', uid)),
    );
    const primero = resultado.docs[0];
    return primero ? docARespuesta(primero.id, primero.data() as Partial<SurveyResponseDoc>) : null;
  }
}
