import { createNavigationContainerRef } from '@react-navigation/native';
import type { RutasRaiz } from './rutas';

/** Referencia global para navegar desde fuera de las pantallas (p. ej. al detectar una apertura). */
export const navegacionRef = createNavigationContainerRef<RutasRaiz>();
