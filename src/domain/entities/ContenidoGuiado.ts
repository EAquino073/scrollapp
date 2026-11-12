import type { TipoActividad } from './ActividadPredeterminada';

/**
 * Contenido guiado de las ocho actividades predeterminadas (fase 5).
 * Vive en un banco local en JSON empaquetado con la app (`data/contenido/actividades`);
 * no se descarga ni se guarda en Firestore. Cada elemento tiene un `id` estable
 * (`leer-001`, `reto-042`…) que se registra en `HabitLog.contenidoId` para el análisis.
 */

export const PARTES_CUERPO = [
  'cuello',
  'hombros',
  'espalda',
  'pecho',
  'costados',
  'brazos',
  'manos',
  'muñecas',
  'cadera',
  'piernas',
  'tobillos',
  'pies',
  'cara',
  'ojos',
] as const;
export type ParteCuerpo = (typeof PARTES_CUERPO)[number];

export interface PasoEstiramiento {
  instruccion: string;
  segundos: number;
  parteCuerpo: ParteCuerpo;
}

/** ESTIRAR: tres pasos que suman 120 s y avanzan solos. */
export interface Estiramiento {
  id: string;
  titulo: string;
  pasos: PasoEstiramiento[];
}

/** AGUA: una indicación breve y un dato verídico sobre agua, hidratación o descanso. */
export interface MensajeAgua {
  id: string;
  mensaje: string;
  dato: string;
}

export type FaseRespiracion = 'inhalar' | 'sostener' | 'exhalar' | 'pausa';

/** RESPIRAR: tiempos en segundos de cada fase (0 = se omite). El ciclo se repite 2 minutos. */
export interface PatronRespiracion {
  id: string;
  nombre: string;
  descripcion: string;
  inhalar: number;
  sostener: number;
  exhalar: number;
  pausa: number;
  /** Indicación propia para alguna fase (opcional). */
  textos?: Partial<Record<FaseRespiracion, string>>;
}

/** ESCRIBIR: pregunta disparadora. Lo que se escribe no se guarda en ningún lado. */
export interface PreguntaNota {
  id: string;
  pregunta: string;
}

/** CAMINAR: sugerencia de atención durante una caminata corta. */
export interface SugerenciaCaminata {
  id: string;
  sugerencia: string;
  detalle: string;
}

export const CATEGORIAS_LECTURA = [
  'ciencia',
  'historia',
  'naturaleza',
  'lenguaje',
  'curiosidades',
  'relato',
] as const;
export type CategoriaLectura = (typeof CATEGORIAS_LECTURA)[number];

/** LEER: dato curioso o micro-relato de 150 a 200 palabras (párrafos separados por "\n\n"). */
export interface Lectura {
  id: string;
  categoria: CategoriaLectura;
  titulo: string;
  texto: string;
}

/** OBSERVAR: reto de atención plena que funciona en cualquier lugar. */
export interface RetoObservacion {
  id: string;
  reto: string;
  detalle: string;
}

export type TipoRetoMental = 'adivinanza' | 'acertijo' | 'logica';

/** RETO_MENTE: acertijo con pista opcional y respuesta revelable. */
export interface RetoMental {
  id: string;
  tipo: TipoRetoMental;
  pregunta: string;
  pista: string;
  respuesta: string;
  explicacion?: string;
}

/** Tipo de elemento del banco según la actividad. */
export interface ContenidoPorTipo {
  ESTIRAR: Estiramiento;
  AGUA: MensajeAgua;
  RESPIRAR: PatronRespiracion;
  ESCRIBIR: PreguntaNota;
  CAMINAR: SugerenciaCaminata;
  LEER: Lectura;
  OBSERVAR: RetoObservacion;
  RETO_MENTE: RetoMental;
}

/** Cualquier elemento del banco de contenido guiado. */
export type ElementoContenido = ContenidoPorTipo[TipoActividad];
