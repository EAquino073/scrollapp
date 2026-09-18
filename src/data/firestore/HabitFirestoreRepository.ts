import { collection, doc, getDocs, query, setDoc, where } from '@react-native-firebase/firestore';
import type { HabitLog, ReplacementHabit } from '../../domain/entities';
import type { HabitRepository } from '../../domain/repositories';
import { COLECCIONES } from './colecciones';
import { db } from './firebase';
import {
  docAHabitLog,
  docAHabito,
  habitLogADoc,
  habitoADoc,
  type HabitLogDoc,
  type ReplacementHabitDoc,
} from './HabitMapper';
import { dentroDelRango, rangoDeSemanaDelUsuario } from './semanaDelUsuario';

/** Implementación de `HabitRepository` sobre `habitosSustitutos` y `registrosHabitos`. */
export class HabitFirestoreRepository implements HabitRepository {
  async obtenerHabitosActivos(uid: string): Promise<ReplacementHabit[]> {
    const consulta = query(
      collection(db, COLECCIONES.habitosSustitutos),
      where('userId', '==', uid),
      where('activo', '==', true),
    );
    const resultado = await getDocs(consulta);
    return resultado.docs
      .map(d => docAHabito(d.id, d.data() as Partial<ReplacementHabitDoc>))
      .sort((a, b) => a.fechaCreacion.getTime() - b.fechaCreacion.getTime());
  }

  async obtenerTodosLosHabitos(uid: string): Promise<ReplacementHabit[]> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.habitosSustitutos), where('userId', '==', uid)),
    );
    return resultado.docs
      .map(d => docAHabito(d.id, d.data() as Partial<ReplacementHabitDoc>))
      .sort((a, b) => a.fechaCreacion.getTime() - b.fechaCreacion.getTime());
  }

  async guardarHabito(habito: ReplacementHabit): Promise<void> {
    await setDoc(doc(db, COLECCIONES.habitosSustitutos, habito.habitId), habitoADoc(habito));
  }

  async registrarCumplimiento(log: HabitLog): Promise<void> {
    await setDoc(doc(db, COLECCIONES.registrosHabitos, log.logId), habitLogADoc(log));
  }

  async obtenerLogsPorSemana(uid: string, semana: number): Promise<HabitLog[]> {
    const rango = await rangoDeSemanaDelUsuario(uid, semana);
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.registrosHabitos), where('userId', '==', uid)),
    );
    return resultado.docs
      .map(d => docAHabitLog(d.id, d.data() as Partial<HabitLogDoc>))
      .filter(log => dentroDelRango(log.fecha, rango));
  }
}
