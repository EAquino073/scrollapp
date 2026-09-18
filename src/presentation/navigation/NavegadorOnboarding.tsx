import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { PantallaBienvenida } from '../screens/onboarding/PantallaBienvenida';
import { PantallaCierre } from '../screens/onboarding/PantallaCierre';
import { PantallaDatosEstudio } from '../screens/onboarding/PantallaDatosEstudio';
import { PantallaHabitosOnboarding } from '../screens/onboarding/PantallaHabitosOnboarding';
import { PantallaIntensidad } from '../screens/onboarding/PantallaIntensidad';
import { PantallaMotivacion } from '../screens/onboarding/PantallaMotivacion';
import { PantallaPermisosOnboarding } from '../screens/onboarding/PantallaPermisosOnboarding';
import { PantallaRedesOnboarding } from '../screens/onboarding/PantallaRedesOnboarding';
import { OnboardingProvider } from '../viewmodels/OnboardingContext';
import type { RutasOnboarding } from './rutas';

const Pila = createNativeStackNavigator<RutasOnboarding>();

/** Flujo de onboarding en ocho pasos; el borrador vive en `OnboardingProvider`. */
export function NavegadorOnboarding() {
  return (
    <OnboardingProvider>
      <Pila.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Pila.Screen name="Bienvenida" component={PantallaBienvenida} />
        <Pila.Screen name="DatosEstudio" component={PantallaDatosEstudio} />
        <Pila.Screen name="Motivacion" component={PantallaMotivacion} />
        <Pila.Screen name="Redes" component={PantallaRedesOnboarding} />
        <Pila.Screen name="HabitosOnboarding" component={PantallaHabitosOnboarding} />
        <Pila.Screen name="Intensidad" component={PantallaIntensidad} />
        <Pila.Screen name="Permisos" component={PantallaPermisosOnboarding} />
        <Pila.Screen name="Cierre" component={PantallaCierre} options={{ gestureEnabled: false }} />
      </Pila.Navigator>
    </OnboardingProvider>
  );
}
