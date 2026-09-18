import { collection, doc, getDocs, query, setDoc, where } from '@react-native-firebase/firestore';
import type { FrictionEvent, ScrollLog, ScrollTarget } from '../../domain/entities';
import type { ScrollRepository } from '../../domain/repositories';
import { fechaISO } from '../../domain/utilidades';
import { COLECCIONES } from './colecciones';
import { db } from './firebase';
import {
  docAFrictionEvent,
  docAScrollLog,
  docATarget,
  frictionEventADoc,
  scrollLogADoc,
  targetADoc,
  type FrictionEventDoc,
  type ScrollLogDoc,
  type ScrollTargetDoc,
} from './ScrollMapper';
import { dentroDelRango, rangoDeSemanaDelUsuario } from './semanaDelUsuario';

/** Implementación de `ScrollRepository` sobre `metasScroll`, `registrosScroll` y `eventosFriccion`. */
export class ScrollFirestoreRepository implements ScrollRepository {
  async obtenerMetasActivas(uid: string): Promise<ScrollTarget[]> {
    const consulta = query(
      collection(db, COLECCIONES.metasScroll),
      where('userId', '==', uid),
      where('activo', '==', true),
    );
    const resultado = await getDocs(consulta);
    return resultado.docs.map(d => docATarget(d.id, d.data() as Partial<ScrollTargetDoc>));
  }

  async obtenerTodasLasMetas(uid: string): Promise<ScrollTarget[]> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.metasScroll), where('userId', '==', uid)),
    );
    return resultado.docs
      .map(d => docATarget(d.id, d.data() as Partial<ScrollTargetDoc>))
      .sort((a, b) => a.numeroSemana - b.numeroSemana);
  }

  async guardarMeta(target: ScrollTarget): Promise<void> {
    await setDoc(doc(db, COLECCIONES.metasScroll, target.targetId), targetADoc(target));
  }

  async registrarUso(log: ScrollLog): Promise<void> {
    await setDoc(doc(db, COLECCIONES.registrosScroll, log.logId), scrollLogADoc(log));
  }

  async obtenerTodosLosLogs(uid: string): Promise<ScrollLog[]> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.registrosScroll), where('userId', '==', uid)),
    );
    return resultado.docs.map(d => docAScrollLog(d.id, d.data() as Partial<ScrollLogDoc>));
  }

  async obtenerLogsPorSemana(uid: string, semana: number): Promise<ScrollLog[]> {
    const rango = await rangoDeSemanaDelUsuario(uid, semana);
    const todos = await this.obtenerTodosLosLogs(uid);
    return todos.filter(log => dentroDelRango(log.fecha, rango));
  }

  async registrarEventoFriccion(evento: FrictionEvent): Promise<void> {
    await setDoc(doc(db, COLECCIONES.eventosFriccion, evento.eventId), frictionEventADoc(evento));
  }

  async obtenerTodosLosEventosFriccion(uid: string): Promise<FrictionEvent[]> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.eventosFriccion), where('userId', '==', uid)),
    );
    return resultado.docs.map(d => docAFrictionEvent(d.id, d.data() as Partial<FrictionEventDoc>));
  }

  async obtenerEventosFriccionPorDia(uid: string, fecha: string): Promise<FrictionEvent[]> {
    const todos = await this.obtenerTodosLosEventosFriccion(uid);
    return todos.filter(evento => fechaISO(evento.timestamp) === fecha);
  }
}
