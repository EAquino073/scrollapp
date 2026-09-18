/** Utilidades de fecha del dominio (hora local del dispositivo). */

const DIA_MS = 24 * 60 * 60 * 1000;

/** Fecha calendario en formato ISO `YYYY-MM-DD` (hora local). */
export function fechaISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Medianoche local del día indicado. */
export function inicioDelDia(fecha: Date): Date {
  const copia = new Date(fecha);
  copia.setHours(0, 0, 0, 0);
  return copia;
}

/**
 * Número de semana del estudio (1 = la semana que empieza el día del registro).
 * La semana 1 es de observación; a partir de la 2 hay metas progresivas.
 */
export function numeroSemanaDelEstudio(fechaRegistro: Date, hoy: Date = new Date()): number {
  const inicio = inicioDelDia(fechaRegistro).getTime();
  const dias = Math.floor((inicioDelDia(hoy).getTime() - inicio) / DIA_MS);
  return Math.max(1, Math.floor(dias / 7) + 1);
}

/** Rango de fechas ISO (inclusive) de una semana del estudio. */
export function rangoDeSemana(fechaRegistro: Date, numeroSemana: number): { desde: string; hasta: string } {
  const inicio = inicioDelDia(fechaRegistro);
  const desde = new Date(inicio.getTime() + (numeroSemana - 1) * 7 * DIA_MS);
  const hasta = new Date(desde.getTime() + 6 * DIA_MS);
  return { desde: fechaISO(desde), hasta: fechaISO(hasta) };
}
