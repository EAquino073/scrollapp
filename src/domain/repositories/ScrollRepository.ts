import type { FrictionEvent, ScrollLog, ScrollTarget } from '../entities';

/** Metas de uso, registros automáticos de uso y eventos de fricción. */
export interface ScrollRepository {
  obtenerMetasActivas(uid: string): Promise<ScrollTarget[]>;
  guardarMeta(target: ScrollTarget): Promise<void>;
  registrarUso(log: ScrollLog): Promise<void>;
  obtenerLogsPorSemana(uid: string, semana: number): Promise<ScrollLog[]>;
  registrarEventoFriccion(evento: FrictionEvent): Promise<void>;

  // --- Extensiones al diagrama, necesarias para el check-in y la revisión semanal ---
  /** Todas las metas del participante, activas e inactivas (para saber cuál regía cada día). */
  obtenerTodasLasMetas(uid: string): Promise<ScrollTarget[]>;
  /** Todos los registros de uso del participante (volumen pequeño: se filtra en cliente). */
  obtenerTodosLosLogs(uid: string): Promise<ScrollLog[]>;
  /** Eventos de fricción de un día concreto (`YYYY-MM-DD`, hora local). */
  obtenerEventosFriccionPorDia(uid: string, fecha: string): Promise<FrictionEvent[]>;
  /** Todos los eventos de fricción del participante. */
  obtenerTodosLosEventosFriccion(uid: string): Promise<FrictionEvent[]>;
}
