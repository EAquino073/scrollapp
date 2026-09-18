import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PantallaAcceso } from '../screens/PantallaAcceso';
import { PantallaAjustes } from '../screens/PantallaAjustes';
import { PantallaCelebracion } from '../screens/PantallaCelebracion';
import { PantallaCheckIn } from '../screens/PantallaCheckIn';
import { PantallaEncuesta } from '../screens/PantallaEncuesta';
import { PantallaFriccion } from '../screens/PantallaFriccion';
import { PantallaHabitos } from '../screens/PantallaHabitos';
import { PantallaHoy } from '../screens/PantallaHoy';
import { PantallaProgreso } from '../screens/PantallaProgreso';
import { PantallaRevisionSemanal } from '../screens/PantallaRevisionSemanal';
import { PantallaSustitucion } from '../screens/PantallaSustitucion';
import { useTema } from '../theme/tema';
import { useSesion } from '../viewmodels/SesionContext';
import { DetectorApertura } from './DetectorApertura';
import { NavegadorOnboarding } from './NavegadorOnboarding';
import { PuenteCicloApp } from './PuenteCicloApp';
import { PuenteNotificaciones } from './PuenteNotificaciones';
import { navegacionRef } from './referencia';
import type { RutasRaiz, RutasTabs } from './rutas';

export { navegacionRef } from './referencia';

const Pila = createNativeStackNavigator<RutasRaiz>();
const Tabs = createBottomTabNavigator<RutasTabs>();

const ICONOS_TABS: Record<keyof RutasTabs, string> = {
  Hoy: '☀️',
  Progreso: '🌱',
  Habitos: '🍃',
  Ajustes: '⚙️',
};

const TITULOS_TABS: Record<keyof RutasTabs, string> = {
  Hoy: 'Hoy',
  Progreso: 'Progreso',
  Habitos: 'Hábitos',
  Ajustes: 'Ajustes',
};

const iconosTabs: Record<keyof RutasTabs, (props: { focused: boolean }) => React.ReactElement> = {
  Hoy: ({ focused }) => <IconoTab nombre="Hoy" enfocado={focused} />,
  Progreso: ({ focused }) => <IconoTab nombre="Progreso" enfocado={focused} />,
  Habitos: ({ focused }) => <IconoTab nombre="Habitos" enfocado={focused} />,
  Ajustes: ({ focused }) => <IconoTab nombre="Ajustes" enfocado={focused} />,
};

function IconoTab({ nombre, enfocado }: { nombre: keyof RutasTabs; enfocado: boolean }) {
  return (
    <Text style={[styles.iconoTab, enfocado ? styles.iconoActivo : styles.iconoInactivo]}>
      {ICONOS_TABS[nombre]}
    </Text>
  );
}

function PestanasPrincipales() {
  const { colores } = useTema();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        title: TITULOS_TABS[route.name],
        tabBarIcon: iconosTabs[route.name],
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        tabBarStyle: {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
          height: 68,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
      })}
    >
      <Tabs.Screen name="Hoy" component={PantallaHoy} />
      <Tabs.Screen name="Progreso" component={PantallaProgreso} />
      <Tabs.Screen name="Habitos" component={PantallaHabitos} />
      <Tabs.Screen name="Ajustes" component={PantallaAjustes} />
    </Tabs.Navigator>
  );
}

/**
 * Raíz de navegación:
 * - sin sesión → Acceso;
 * - con sesión sin onboarding → Onboarding (una sola vez);
 * - con onboarding completo → pestañas principales y, sobre ellas, el ciclo de fricción.
 */
export function Navegacion() {
  const sesion = useSesion();
  const tema = useTema();
  const [listo, setListo] = useState(false);

  const temaNavegacion = {
    ...(tema.esOscuro ? DarkTheme : DefaultTheme),
    colors: {
      ...(tema.esOscuro ? DarkTheme.colors : DefaultTheme.colors),
      background: tema.colores.fondo,
      primary: tema.colores.primario,
      text: tema.colores.texto,
      card: tema.colores.superficie,
      border: tema.colores.borde,
    },
  };

  if (sesion.inicializando) {
    return (
      <View style={[styles.cargando, { backgroundColor: tema.colores.fondo }]}>
        <ActivityIndicator size="large" color={tema.colores.primario} />
      </View>
    );
  }

  const usuario = sesion.usuario;

  return (
    <NavigationContainer ref={navegacionRef} theme={temaNavegacion} onReady={() => setListo(true)}>
      <Pila.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
        {!usuario ? (
          <Pila.Screen name="Acceso" component={PantallaAcceso} />
        ) : !usuario.onboardingCompletado ? (
          <Pila.Screen name="Onboarding" component={NavegadorOnboarding} />
        ) : (
          <>
            <Pila.Screen name="Principal" component={PestanasPrincipales} />
            <Pila.Screen
              name="Friccion"
              component={PantallaFriccion}
              options={{ animation: 'fade', gestureEnabled: false }}
            />
            <Pila.Screen name="Sustitucion" component={PantallaSustitucion} options={{ gestureEnabled: false }} />
            <Pila.Screen name="Celebracion" component={PantallaCelebracion} options={{ gestureEnabled: false }} />
            <Pila.Screen name="CheckIn" component={PantallaCheckIn} options={{ animation: 'slide_from_bottom' }} />
            <Pila.Screen name="RevisionSemanal" component={PantallaRevisionSemanal} />
            <Pila.Screen name="Encuesta" component={PantallaEncuesta} />
          </>
        )}
      </Pila.Navigator>
      <DetectorApertura listo={listo} />
      <PuenteNotificaciones listo={listo} />
      <PuenteCicloApp />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTab: {
    fontSize: 20,
  },
  iconoActivo: {
    opacity: 1,
  },
  iconoInactivo: {
    opacity: 0.55,
  },
});
