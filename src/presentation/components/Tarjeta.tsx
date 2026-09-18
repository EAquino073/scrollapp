import React, { type ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTema } from '../theme/tema';

export type TonoTarjeta = 'superficie' | 'suave' | 'primario' | 'secundario' | 'acento';

interface Props {
  children: ReactNode;
  tono?: TonoTarjeta;
  estilo?: StyleProp<ViewStyle>;
  /** Relleno interno reducido. */
  compacta?: boolean;
}

/** Superficie elevada con bordes redondeados. El tono cambia el fondo, no el contenido. */
export function Tarjeta({ children, tono = 'superficie', estilo, compacta = false }: Props) {
  const { colores, radios, espaciado, sombraSuave } = useTema();
  const fondo = {
    superficie: colores.superficie,
    suave: colores.superficieSuave,
    primario: colores.primarioSuave,
    secundario: colores.secundarioSuave,
    acento: colores.acentoSuave,
  }[tono];

  return (
    <View
      style={[
        styles.base,
        tono === 'superficie' && sombraSuave,
        {
          backgroundColor: fondo,
          borderColor: tono === 'superficie' ? colores.borde : 'transparent',
          borderRadius: radios.l,
          padding: compacta ? espaciado.m : espaciado.l,
        },
        estilo,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    gap: 8,
  },
});
