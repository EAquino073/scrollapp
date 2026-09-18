/**
 * Meta de uso diario para una red social en una semana concreta.
 * Colección: `metasScroll`. El `targetId` es el ID del documento.
 * La semana 1 es de observación (línea base); a partir de la semana 2
 * el límite baja un 10 % respecto al promedio propio del usuario.
 */
export interface ScrollTarget {
  targetId: string;
  userId: string;
  redSocial: string;
  limiteMinutosDiarios: number;
  numeroSemana: number;
  fechaCreacion: Date;
  activo: boolean;
}
