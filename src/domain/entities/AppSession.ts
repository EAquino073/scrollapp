/**
 * Sesión de uso de la propia app (para medir frecuencia de interacción).
 * Colección: `sesionesApp`. El `sessionId` es el ID del documento.
 */
export interface AppSession {
  sessionId: string;
  userId: string;
  aperturaApp: Date;
  duracionSeg: number;
}
