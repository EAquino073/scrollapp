import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useTema } from '../theme/tema';

export type VarianteBoton = 'primario' | 'secundario' | 'texto';

interface Props {
  titulo: string;
  onPress: () => void;
  variante?: VarianteBoton;
  cargando?: boolean;
  deshabilitado?: boolean;
  /** Ocupa todo el ancho disponible (por defecto sí). */
  ancho?: boolean;
  estilo?: StyleProp<ViewStyle>;
  accesibilidad?: string;
}

/**
 * Botón con tres variantes y una animación sutil de escala al presionar.
 * Deshabilitado no significa "bloqueado": se atenúa, nunca se oculta.
 */
export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando = false,
  deshabilitado = false,
  ancho = true,
  estilo,
  accesibilidad,
}: Props) {
  const { colores, radios, espaciado, duraciones } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const inactivo = deshabilitado || cargando;

  const animar = (hacia: number) =>
    Animated.timing(escala, {
      toValue: hacia,
      duration: duraciones.corta,
      useNativeDriver: true,
    }).start();

  const fondo = {
    primario: colores.primario,
    secundario: 'transparent',
    texto: 'transparent',
  }[variante];
  const borde = variante === 'secundario' ? colores.primario : 'transparent';
  const colorTexto = variante === 'primario' ? colores.sobrePrimario : colores.primario;

  return (
    <Animated.View style={[{ transform: [{ scale: escala }] }, ancho && styles.ancho, estilo]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => animar(0.97)}
        onPressOut={() => animar(1)}
        disabled={inactivo}
        accessibilityRole="button"
        accessibilityLabel={accesibilidad ?? titulo}
        accessibilityState={{ disabled: inactivo, busy: cargando }}
        style={[
          styles.base,
          {
            backgroundColor: fondo,
            borderColor: borde,
            borderRadius: radios.m,
            paddingVertical: variante === 'texto' ? espaciado.s : 14,
            paddingHorizontal: espaciado.l,
            opacity: inactivo ? 0.55 : 1,
          },
        ]}
      >
        {cargando ? (
          <ActivityIndicator color={colorTexto} />
        ) : (
          <Text style={[styles.texto, { color: colorTexto }]}>{titulo}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ancho: { alignSelf: 'stretch' },
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    minHeight: 48,
  },
  texto: {
    fontSize: 16,
    fontWeight: '600',
  },
});
