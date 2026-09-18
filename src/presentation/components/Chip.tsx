import React from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { useTema } from '../theme/tema';

interface Props {
  etiqueta: string;
  seleccionado?: boolean;
  onPress?: () => void;
  /** Emoji o símbolo corto a la izquierda. */
  icono?: string;
  deshabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
}

/** Chip de selección: se usa para elegir redes sociales, modo de intensidad, estados de ánimo. */
export function Chip({ etiqueta, seleccionado = false, onPress, icono, deshabilitado, estilo }: Props) {
  const { colores, radios, espaciado } = useTema();
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado || !onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: seleccionado, disabled: deshabilitado }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: seleccionado ? colores.primario : colores.superficieSuave,
          borderColor: seleccionado ? colores.primario : colores.borde,
          borderRadius: radios.redondo,
          paddingHorizontal: espaciado.m,
          opacity: pressed ? 0.85 : deshabilitado ? 0.5 : 1,
        },
        estilo,
      ]}
    >
      {icono ? <Text style={styles.icono}>{icono}</Text> : null}
      <Text
        style={[
          styles.texto,
          { color: seleccionado ? colores.sobrePrimario : colores.texto },
        ]}
      >
        {etiqueta}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    paddingVertical: 9,
    minHeight: 40,
  },
  icono: {
    fontSize: 15,
  },
  texto: {
    fontSize: 15,
    fontWeight: '500',
  },
});
