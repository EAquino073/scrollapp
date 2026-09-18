import React, { createContext, useContext, type ReactNode } from 'react';
import { useSesionViewModel, type SesionViewModel } from './useSesionViewModel';

const SesionContext = createContext<SesionViewModel | null>(null);

/** Expone el ViewModel de sesión a toda la app (una sola instancia). */
export function SesionProvider({ children }: { children: ReactNode }) {
  const sesion = useSesionViewModel();
  return <SesionContext.Provider value={sesion}>{children}</SesionContext.Provider>;
}

export function useSesion(): SesionViewModel {
  const sesion = useContext(SesionContext);
  if (!sesion) {
    throw new Error('useSesion debe usarse dentro de SesionProvider');
  }
  return sesion;
}
