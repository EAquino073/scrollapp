import React, { useEffect, useRef, type ReactNode } from 'react';
import { Animated, type StyleProp, type ViewStyle } from 'react-native';
import { useTema } from '../theme/tema';

interface Props {
  children: ReactNode;
  estilo?: StyleProp<ViewStyle>;
}

/**
 * Entrada suave (fundido y un leve desplazamiento). Para repetirla al cambiar de
 * contenido, dale al componente una `key` distinta.
 */
export function Aparecer({ children, estilo }: Props) {
  const { duraciones } = useTema();
  const opacidad = useRef(new Animated.Value(0)).current;
  const desplazamiento = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: duraciones.larga, useNativeDriver: true }),
      Animated.timing(desplazamiento, { toValue: 0, duration: duraciones.larga, useNativeDriver: true }),
    ]).start();
  }, [desplazamiento, duraciones.larga, opacidad]);

  return (
    <Animated.View style={[estilo, { opacity: opacidad, transform: [{ translateY: desplazamiento }] }]}>
      {children}
    </Animated.View>
  );
}
