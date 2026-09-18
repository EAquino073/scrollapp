/**
 * Encuesta final del estudio, tal como está en el anexo de la tesis.
 * Escala Likert de 5 niveles y dos preguntas abiertas.
 */
export interface SeccionEncuesta {
  clave: 'B' | 'C' | 'D' | 'E';
  titulo: string;
  descripcion: string;
  afirmaciones: string[];
}

export const ESCALA_LIKERT = [
  { valor: 1, etiqueta: 'Totalmente en desacuerdo' },
  { valor: 2, etiqueta: 'En desacuerdo' },
  { valor: 3, etiqueta: 'Ni de acuerdo ni en desacuerdo' },
  { valor: 4, etiqueta: 'De acuerdo' },
  { valor: 5, etiqueta: 'Totalmente de acuerdo' },
] as const;

export const SECCIONES_ENCUESTA: SeccionEncuesta[] = [
  {
    clave: 'B',
    titulo: 'Registro y seguimiento',
    descripcion: 'Sobre cómo la app registró y siguió tus actividades.',
    afirmaciones: [
      'La aplicación me permitió registrar mis actividades diarias de forma sencilla.',
      'El proceso de registro de hábitos resultó claro y fácil de comprender.',
      'Pude dar seguimiento al cumplimiento de mis hábitos sin dificultad.',
      'El registro diario me motivó a mantener mis actividades de forma constante.',
      'La aplicación me ayudó a cumplir la mayoría de los hábitos que me propuse.',
    ],
  },
  {
    clave: 'C',
    titulo: 'Recordatorios',
    descripcion: 'Sobre las pausas y los recordatorios que recibiste.',
    afirmaciones: [
      'Las notificaciones me recordaron realizar mis actividades en el momento adecuado.',
      'Los recordatorios aumentaron la frecuencia con la que abrí la aplicación.',
      'La cantidad de notificaciones fue apropiada, ni escasa ni excesiva.',
      'Los recordatorios me ayudaron a mantener constancia a lo largo de la semana.',
    ],
  },
  {
    clave: 'D',
    titulo: 'Tu progreso',
    descripcion: 'Sobre cómo viste tu avance.',
    afirmaciones: [
      'Las gráficas y métricas me permitieron entender mi avance con claridad.',
      'La visualización del progreso me motivó a mejorar mi nivel de cumplimiento.',
      'La información mostrada reflejó de forma fiel mi desempeño real.',
      'Ver mi progreso me ayudó a identificar en qué hábitos debía esforzarme más.',
    ],
  },
  {
    clave: 'E',
    titulo: 'La app en general',
    descripcion: 'Sobre la facilidad de uso y si te gustaría seguir usándola.',
    afirmaciones: [
      'La aplicación es fácil de usar.',
      'Aprendí a utilizar la aplicación con rapidez.',
      'Considero que la aplicación es útil para mejorar mis hábitos.',
      'La aplicación funcionó de forma estable en mi dispositivo.',
      'Me gustaría continuar utilizando la aplicación después del período de prueba.',
      'Recomendaría la aplicación a otras personas en un proceso similar.',
    ],
  },
];

export const PREGUNTAS_ABIERTAS = [
  '¿Qué aspecto de la aplicación consideras más útil para tu proceso de cambio de hábitos?',
  '¿Qué mejora sugieres para futuras versiones de la aplicación?',
];
