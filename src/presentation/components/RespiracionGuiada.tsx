import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useTema } from '../theme/tema';

const FASE_MS = 4000;

/**
 * Respiración guiada: un círculo que crece al inhalar y se encoge al exhalar (4 s cada fase).
 * Se usa en la pausa de intensidad fuerte.
 */
export function RespiracionGuiada() {
  const { colores, tipografia } = useTema();
  const escala = useRef(new Animated.Value(1)).current;
  const [inhalando, setInhalando] = useState(true);

  useEffect(() => {
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, {
          toValue: 1.55,
          duration: FASE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(escala, {
          toValue: 1,
          duration: FASE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    ciclo.start();
    const alternar = setInterval(() => setInhalando(previo => !previo), FASE_MS);
    return () => {
      ciclo.stop();
      clearInterval(alternar);
    };
  }, [escala]);

  return (
    <View style={styles.contenedor} accessibilityLabel="Respiración guiada">
      <View style={styles.zona}>
        <Animated.View
          style={[
            styles.halo,
            { backgroundColor: colores.primarioSuave, transform: [{ scale: escala }] },
          ]}
        />
        <View style={[styles.nucleo, { backgroundColor: colores.primario }]} />
      </View>
      <Text style={[tipografia.cuerpoFuerte, { color: colores.primario }]}>
        {inhalando ? 'Inhala despacio…' : 'Suelta el aire…'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    gap: 16,
  },
  zona: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  nucleo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
});
