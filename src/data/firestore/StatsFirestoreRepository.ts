import { collection, doc, getDocs, query, setDoc, where } from '@react-native-firebase/firestore';
import type { WeeklyStats } from '../../domain/entities';
import type { StatsRepository } from '../../domain/repositories';
import { COLECCIONES } from './colecciones';
import { db } from './firebase';
import { docAStats, statsADoc, type WeeklyStatsDoc } from './StatsMapper';

/**
 * Implementación de `StatsRepository` sobre `estadisticasSemanales`.
 * El cálculo vive en el caso de uso `GenerarRevisionSemanal` (necesita varias colecciones),
 * así que aquí `calcularEstadisticasSemanales` solo recupera lo ya guardado.
 */
export class StatsFirestoreRepository implements StatsRepository {
  async obtenerHistorial(uid: string): Promise<WeeklyStats[]> {
    const resultado = await getDocs(
      query(collection(db, COLECCIONES.estadisticasSemanales), where('userId', '==', uid)),
    );
    return resultado.docs
      .map(d => docAStats(d.id, d.data() as Partial<WeeklyStatsDoc>))
      .sort((a, b) => a.numeroSemana - b.numeroSemana);
  }

  /** Estadísticas ya guardadas de una semana; lanza si aún no se han generado. */
  async calcularEstadisticasSemanales(uid: string, semana: number): Promise<WeeklyStats> {
    const historial = await this.obtenerHistorial(uid);
    const stats = historial.find(s => s.numeroSemana === semana);
    if (!stats) {
      throw new Error(`Todavía no hay estadísticas de la semana ${semana}`);
    }
    return stats;
  }

  async guardarEstadisticas(stats: WeeklyStats): Promise<void> {
    await setDoc(doc(db, COLECCIONES.estadisticasSemanales, stats.statId), statsADoc(stats));
  }
}
