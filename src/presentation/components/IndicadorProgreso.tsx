import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../theme/tema';

interface Props {
  /** Avance entre 0 y 1. */
  progreso: number;
  etiqueta?: string;
  /** Texto a la derecha de la etiqueta, p. ej. "3 de 7". */
  detalle?: string;
  /** Color de la barra (por defecto el primario). */
  color?: string;
  /** Altura de la barra. */
  grosor?: number;
}

/** Barra de progreso con animación suave. Un mal día baja la barra, no la vacía. */
export function IndicadorProgreso({ progreso, etiqueta, detalle, color, grosor = 10 }: Props) {
  const { colores, radios, tipografia, duraciones } = useTema();
  const ancho = useRef(new Animated.Value(0)).current;
  const valor = Math.min(1, Math.max(0, Number.isFinite(progreso) ? progreso : 0));

  useEffect(() => {
    Animated.timing(ancho, {
      toValue: valor,
      duration: duraciones.larga,
      useNativeDriver: false,
    }).start();
  }, [ancho, duraciones.larga, valor]);

  return (
    <View
      style={styles.contenedor}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(valor * 100) }}
    >
      {etiqueta || detalle ? (
        <View style={styles.fila}>
          {etiqueta ? <Text style={tipografia.etiqueta}>{etiqueta}</Text> : <View />}
          {detalle ? <Text style={tipografia.pequeno}>{detalle}</Text> : null}
        </View>
      ) : null}
      <View
        style={[
          styles.pista,
          { height: grosor, borderRadius: radios.redondo, backgroundColor: colores.superficieSuave },
        ]}
      >
        <Animated.View
          style={{
            height: grosor,
            borderRadius: radios.redondo,
            backgroundColor: color ?? colores.secundario,
            width: ancho.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 8,
  },
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  pista: {
    overflow: 'hidden',
    width: '100%',
  },
});
