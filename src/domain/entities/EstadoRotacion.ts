/**
 * Estado de la rotación de contenido de una actividad para un usuario (fase 5).
 * Se guarda en el dispositivo (AsyncStorage), no en Firestore: solo sirve para no
 * repetir contenido hasta agotar el banco.
 *
 * Cada vuelta equivale a barajar el banco y sacar las cartas una a una: se elige al
 * azar entre lo que aún no se mostró en la vuelta. Llevar la lista de lo mostrado (y no
 * un orden precalculado) hace que la rotación tolere que el banco crezca o pierda
 * elementos en una actualización de la app.
 */
export interface EstadoRotacion {
  /** IDs ya mostrados en la vuelta actual. */
  mostrados: string[];
  /** Último ID mostrado; al empezar una vuelta nueva no se repite enseguida. */
  ultimo: string | null;
}
