import React, { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTema } from '../theme/tema';

interface Props {
  children: ReactNode;
  /** Envuelve el contenido en un ScrollView (por defecto sí). */
  desplazable?: boolean;
  /** Centra el contenido verticalmente (útil en pantallas cortas). */
  centrado?: boolean;
  /** Sin relleno horizontal (para listas a sangre). */
  sinRelleno?: boolean;
  /** Ignora el inset superior (cuando hay encabezado de navegación). */
  sinInsetSuperior?: boolean;
  estilo?: ViewStyle;
}

/** Contenedor base de toda pantalla: fondo del tema, insets seguros y relleno estándar. */
export function Pantalla({
  children,
  desplazable = true,
  centrado = false,
  sinRelleno = false,
  sinInsetSuperior = false,
  estilo,
}: Props) {
  const tema = useTema();
  const insets = useSafeAreaInsets();
  const relleno = {
    paddingTop: (sinInsetSuperior ? 0 : insets.top) + tema.espaciado.l,
    paddingBottom: insets.bottom + tema.espaciado.xl,
    paddingHorizontal: sinRelleno ? 0 : tema.espaciado.l,
  };

  if (!desplazable) {
    return (
      <View
        style={[
          styles.base,
          { backgroundColor: tema.colores.fondo },
          relleno,
          centrado && styles.centrado,
          estilo,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.base, { backgroundColor: tema.colores.fondo }]}
      contentContainerStyle={[relleno, centrado && styles.centrado, styles.contenido, estilo]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  base: { flex: 1 },
  contenido: { flexGrow: 1 },
  centrado: { justifyContent: 'center' },
});
