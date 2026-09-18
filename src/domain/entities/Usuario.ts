import type { ModoIntensidad } from './ModoIntensidad';

/**
 * Participante del estudio. El `uid` es el ID del documento en la
 * colección `usuarios` y coincide con el uid de Firebase Auth.
 * No se guarda el correo en Firestore: `codigoParticipante` es el
 * identificador anónimo que se usa en el análisis del estudio.
 */
export interface Usuario {
  uid: string;
  codigoParticipante: string;
  rangoEdad: string;
  genero: string;
  redesSocialesPrincipales: string[];
  gamaDispositivo: string;
  /** Minutos promedio de uso diario medidos en la semana 1 (línea base). */
  tiempoUsoDiarioBaseline: number;
  modoIntensidad: ModoIntensidad;
  /** El "por qué" declarado en el onboarding; ancla la motivación a largo plazo. */
  motivacionPersonal: string;
  onboardingCompletado: boolean;
  activo: boolean;
  fechaRegistro: Date;
}
