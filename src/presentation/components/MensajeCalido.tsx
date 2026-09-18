import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../theme/tema';

interface Props {
  texto: string;
  /** Emoji o símbolo que acompaña el mensaje. */
  icono?: string;
  tono?: 'primario' | 'secundario' | 'acento' | 'neutro';
  /** Título corto sobre el texto. */
  titulo?: string;
}

/**
 * Mensaje motivacional o de acompañamiento. Aparece con un fundido suave.
 * Los textos deben ser específicos y humanos, nunca frases genéricas de sistema.
 */
export function MensajeCalido({ texto, icono, tono = 'primario', titulo }: Props) {
  const { colores, radios, espaciado, tipografia, duraciones } = useTema();
  const opacidad = useRef(new Animated.Value(0)).current;
  const desplazamiento = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: duraciones.larga, useNativeDriver: true }),
      Animated.timing(desplazamiento, {
        toValue: 0,
        duration: duraciones.larga,
        useNativeDriver: true,
      }),
    ]).start();
  }, [desplazamiento, duraciones.larga, opacidad]);

  const fondo = {
    primario: colores.primarioSuave,
    secundario: colores.secundarioSuave,
    acento: colores.acentoSuave,
    neutro: colores.superficieSuave,
  }[tono];

  return (
    <Animated.View
      style={[
        styles.contenedor,
        {
          backgroundColor: fondo,
          borderRadius: radios.l,
          padding: espaciado.m,
          opacity: opacidad,
          transform: [{ translateY: desplazamiento }],
        },
      ]}
      accessibilityRole="text"
    >
      {icono ? <Text style={styles.icono}>{icono}</Text> : null}
      <View style={styles.texto}>
        {titulo ? <Text style={tipografia.cuerpoFuerte}>{titulo}</Text> : null}
        <Text style={tipografia.cuerpo}>{texto}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  icono: {
    fontSize: 24,
    lineHeight: 30,
  },
  texto: {
    flex: 1,
    gap: 4,
  },
});
