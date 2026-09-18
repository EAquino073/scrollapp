/**
 * Catálogo de micro-actividades predeterminadas.
 *
 * Distinción que prepara la fase 5:
 * - **Actividad predeterminada**: tiene `tipoActividad` (un código estable). En la fase 5
 *   cada tipo tendrá su contenido guiado en un banco local (pasos, texto, minijuego).
 * - **Hábito propio del usuario**: `tipoActividad = null`. Solo temporizador cálido.
 *
 * Los códigos no cambian nunca: se guardan en Firestore y el contenido guiado se
 * enganchará a ellos sin migrar datos.
 */
export const TIPOS_ACTIVIDAD = [
  'ESTIRAR',
  'AGUA',
  'RESPIRAR',
  'ESCRIBIR',
  'CAMINAR',
  'LEER',
  'OBSERVAR',
  'RETO_MENTE',
] as const;

export type TipoActividad = (typeof TIPOS_ACTIVIDAD)[number];

export interface ActividadPredeterminada {
  tipoActividad: TipoActividad;
  nombre: string;
  duracionMinutos: number;
  /** Emoji que la acompaña en la interfaz. */
  icono: string;
  /** Una línea que explica en qué consiste, para el onboarding. */
  descripcion: string;
  /**
   * `true` cuando la fase 5 le pondrá contenido guiado o minijuego.
   * Hoy todas funcionan con el temporizador cálido.
   */
  tendraContenidoGuiado: boolean;
}

/** Las ocho actividades sugeridas (onboarding y pestaña Hábitos). */
export const ACTIVIDADES_PREDETERMINADAS: ActividadPredeterminada[] = [
  {
    tipoActividad: 'ESTIRAR',
    nombre: 'Estirarme',
    duracionMinutos: 2,
    icono: '🙆',
    descripcion: 'Soltar cuello, hombros y espalda sin levantarte del lugar.',
    tendraContenidoGuiado: true,
  },
  {
    tipoActividad: 'AGUA',
    nombre: 'Tomar un vaso de agua',
    duracionMinutos: 2,
    icono: '💧',
    descripcion: 'Ir por agua y beberla sin pantalla enfrente.',
    tendraContenidoGuiado: true,
  },
  {
    tipoActividad: 'RESPIRAR',
    nombre: 'Respirar profundo',
    duracionMinutos: 2,
    icono: '🌬️',
    descripcion: 'Unas cuantas respiraciones lentas para bajar el impulso.',
    tendraContenidoGuiado: true,
  },
  {
    tipoActividad: 'ESCRIBIR',
    nombre: 'Escribir una nota',
    duracionMinutos: 3,
    icono: '✏️',
    descripcion: 'Anotar lo que traes en la cabeza, aunque sean tres líneas.',
    tendraContenidoGuiado: true,
  },
  {
    tipoActividad: 'CAMINAR',
    nombre: 'Caminar un poco',
    duracionMinutos: 3,
    icono: '🚶',
    descripcion: 'Dar unos pasos, aunque sea dentro de la casa.',
    tendraContenidoGuiado: true,
  },
  {
    tipoActividad: 'LEER',
    nombre: 'Leer algo',
    duracionMinutos: 3,
    icono: '📖',
    descripcion: 'Unas páginas de lo que tengas a mano.',
    tendraContenidoGuiado: true,
  },
  {
    tipoActividad: 'OBSERVAR',
    nombre: 'Observar a tu alrededor',
    duracionMinutos: 2,
    icono: '👀',
    descripcion: 'Mirar con calma lo que hay cerca de ti, sin buscar nada.',
    tendraContenidoGuiado: true,
  },
  {
    tipoActividad: 'RETO_MENTE',
    nombre: 'Un reto para la mente',
    duracionMinutos: 3,
    icono: '🧩',
    descripcion: 'Un juego tranquilo para ocupar la cabeza un momento.',
    tendraContenidoGuiado: true,
  },
];

export function actividadPorTipo(tipo: string | null | undefined): ActividadPredeterminada | undefined {
  if (!tipo) {
    return undefined;
  }
  return ACTIVIDADES_PREDETERMINADAS.find(actividad => actividad.tipoActividad === tipo);
}

/** Icono de un hábito: el de su actividad predeterminada, o una hoja para los propios. */
export function iconoDeHabito(tipo: string | null | undefined): string {
  return actividadPorTipo(tipo)?.icono ?? '🍃';
}

/** Mínimo y máximo de hábitos sustitutos activos (fase 4). */
export const MINIMO_HABITOS = 3;
export const MAXIMO_HABITOS = 5;
