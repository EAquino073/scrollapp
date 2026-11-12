import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTema } from '../theme/tema';

export type VarianteAnimacion = 'ondas' | 'pasos' | 'mirada';

interface Props {
  variante: VarianteAnimacion;
  /** Cuando es `false`, la animación se detiene. */
  activo?: boolean;
}

const TAMANO = 132;

/**
 * Animación tranquila que acompaña las actividades de agua, caminata y observación.
 * Lenta, sin destellos ni cambios bruscos, y siempre con el driver nativo para que no
 * pese en teléfonos de gama baja.
 */
export function AnimacionTranquila({ variante, activo = true }: Props) {
  return (
    <View style={styles.zona} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {variante === 'ondas' ? <Ondas activo={activo} /> : null}
      {variante === 'pasos' ? <Pasos activo={activo} /> : null}
      {variante === 'mirada' ? <Mirada activo={activo} /> : null}
    </View>
  );
}

/** Tres anillos que se expanden y se desvanecen, como un vaso de agua al posarse. */
function Ondas({ activo }: { activo: boolean }) {
  const { colores } = useTema();
  const valores = useRef([0, 1, 2].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (!activo) {
      return;
    }
    const animaciones = valores.map((valor, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 1400),
          Animated.timing(valor, {
            toValue: 1,
            duration: 4200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(valor, { toValue: 0, duration: 0, useNativeDriver: true }),
          Animated.delay((2 - i) * 1400),
        ]),
      ),
    );
    animaciones.forEach(a => a.start());
    return () => animaciones.forEach(a => a.stop());
  }, [activo, valores]);

  return (
    <>
      {valores.map((valor, i) => (
        <Animated.View
          key={i}
          style={[
            styles.anillo,
            {
              borderColor: colores.secundario,
              opacity: valor.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.55, 0] }),
              transform: [{ scale: valor.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
            },
          ]}
        />
      ))}
      <View style={[styles.gota, { backgroundColor: colores.secundario }]} />
    </>
  );
}

/** Dos huellas que se turnan con suavidad, al ritmo de un paso tranquilo. */
function Pasos({ activo }: { activo: boolean }) {
  const { colores } = useTema();
  const valor = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activo) {
      return;
    }
    const ciclo = Animated.loop(
      Animated.sequence([
        Animated.timing(valor, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(valor, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [activo, valor]);

  const huella = (izquierda: boolean) => (
    <Animated.View
      style={[
        styles.huella,
        !izquierda && styles.huellaAdelantada,
        {
          backgroundColor: colores.primario,
          opacity: valor.interpolate({
            inputRange: [0, 1],
            outputRange: izquierda ? [0.9, 0.25] : [0.25, 0.9],
          }),
          transform: [
            {
              translateY: valor.interpolate({
                inputRange: [0, 1],
                outputRange: izquierda ? [0, -6] : [-6, 0],
              }),
            },
          ],
        },
      ]}
    />
  );

  return (
    <View style={styles.filaHuellas}>
      {huella(true)}
      {huella(false)}
    </View>
  );
}

/** Un punto que recorre despacio un anillo, como una mirada que da la vuelta. */
function Mirada({ activo }: { activo: boolean }) {
  const { colores } = useTema();
  const giro = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!activo) {
      return;
    }
    const ciclo = Animated.loop(
      Animated.timing(giro, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true }),
    );
    ciclo.start();
    return () => ciclo.stop();
  }, [activo, giro]);

  return (
    <>
      <View style={[styles.anilloFijo, { borderColor: colores.acentoSuave }]} />
      <Animated.View
        style={[
          styles.orbita,
          { transform: [{ rotate: giro.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
        ]}
      >
        <View style={[styles.punto, { backgroundColor: colores.acento }]} />
      </Animated.View>
      <View style={[styles.centro, { backgroundColor: colores.acentoSuave }]} />
    </>
  );
}

const styles = StyleSheet.create({
  zona: {
    width: TAMANO,
    height: TAMANO,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  anillo: {
    position: 'absolute',
    width: TAMANO,
    height: TAMANO,
    borderRadius: TAMANO / 2,
    borderWidth: 3,
  },
  gota: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  filaHuellas: {
    flexDirection: 'row',
    gap: 22,
  },
  huella: {
    width: 26,
    height: 40,
    borderRadius: 13,
  },
  huellaAdelantada: {
    marginTop: 36,
  },
  anilloFijo: {
    position: 'absolute',
    width: TAMANO - 16,
    height: TAMANO - 16,
    borderRadius: (TAMANO - 16) / 2,
    borderWidth: 3,
  },
  orbita: {
    position: 'absolute',
    width: TAMANO - 16,
    height: TAMANO - 16,
    alignItems: 'center',
  },
  punto: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -6,
  },
  centro: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});
