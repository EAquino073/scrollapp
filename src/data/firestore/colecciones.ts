/**
 * Nombres exactos de las colecciones de Firestore.
 * No renombrar: coinciden con el diagrama ER y con las reglas de seguridad.
 */
export const COLECCIONES = {
  usuarios: 'usuarios',
  metasScroll: 'metasScroll',
  registrosScroll: 'registrosScroll',
  eventosFriccion: 'eventosFriccion',
  habitosSustitutos: 'habitosSustitutos',
  registrosHabitos: 'registrosHabitos',
  reflexionesDiarias: 'reflexionesDiarias',
  estadisticasSemanales: 'estadisticasSemanales',
  sesionesApp: 'sesionesApp',
  respuestasEncuesta: 'respuestasEncuesta',
} as const;
