import type { NavigatorScreenParams } from '@react-navigation/native';

/** Pestañas principales. */
export type RutasTabs = {
  Hoy: undefined;
  Progreso: undefined;
  Habitos: undefined;
  Ajustes: undefined;
};

/** Pasos del onboarding (se recorre una sola vez tras el registro). */
export type RutasOnboarding = {
  Bienvenida: undefined;
  DatosEstudio: undefined;
  Motivacion: undefined;
  Redes: undefined;
  HabitosOnboarding: undefined;
  Intensidad: undefined;
  Permisos: undefined;
  Cierre: undefined;
};

/** Pila raíz: acceso, onboarding, pestañas y las pantallas del ciclo de fricción. */
export type RutasRaiz = {
  Acceso: undefined;
  Onboarding: NavigatorScreenParams<RutasOnboarding> | undefined;
  Principal: NavigatorScreenParams<RutasTabs> | undefined;
  CheckIn: undefined;
  RevisionSemanal: { numeroSemana?: number } | undefined;
  Encuesta: undefined;
  Friccion: { paquete: string; redSocial: string };
  Sustitucion: { paquete: string; redSocial: string; habitId: string };
  Celebracion: {
    habitId: string;
    nombreHabito: string;
    duracionMinutos: number;
    cumplido: boolean;
    redSocial: string;
    /** El minijuego se saltó (fase 5): mensaje neutro, sin «no salió». */
    saltado?: boolean;
  };
};
