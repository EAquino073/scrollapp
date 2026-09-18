import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MODOS_INTENSIDAD, type ModoIntensidad } from '../../../domain/entities';
import { Boton, EncabezadoOnboarding, Pantalla } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useOnboarding } from '../../viewmodels/OnboardingContext';

type Props = NativeStackScreenProps<RutasOnboarding, 'Intensidad'>;

export const DESCRIPCION_MODOS: Record<ModoIntensidad, { titulo: string; icono: string; texto: string }> = {
  SUAVE: {
    titulo: 'Suave',
    icono: '🌤️',
    texto: 'Una pausa de 3 segundos con una sola pregunta: "¿para qué vas a entrar?". Lo justo para darte cuenta.',
  },
  MEDIO: {
    titulo: 'Medio',
    icono: '🌿',
    texto: 'Una pausa de 8 segundos con la pregunta y uno de tus hábitos sustitutos como alternativa.',
  },
  FUERTE: {
    titulo: 'Fuerte',
    icono: '🌊',
    texto: 'Una pausa de 15 segundos con la pregunta, un hábito sugerido y una respiración guiada para bajar el impulso.',
  },
};

/** Paso 6: intensidad del acompañamiento (tres tarjetas). */
export function PantallaIntensidad({ navigation }: Props) {
  const { borrador, actualizar } = useOnboarding();
  const { tipografia, espaciado, colores, radios } = useTema();

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={6}
        titulo="¿Cuánto quieres que te acompañemos?"
        subtitulo="Ninguna opción bloquea nada. Solo cambia cuánto tiempo dura la pausa antes de entrar."
      />

      <View style={{ gap: espaciado.m }}>
        {MODOS_INTENSIDAD.map(modo => {
          const info = DESCRIPCION_MODOS[modo];
          const seleccionado = borrador.modoIntensidad === modo;
          return (
            <Pressable
              key={modo}
              onPress={() => actualizar({ modoIntensidad: modo })}
              accessibilityRole="radio"
              accessibilityState={{ selected: seleccionado }}
              style={({ pressed }) => [
                styles.tarjeta,
                {
                  backgroundColor: seleccionado ? colores.primarioSuave : colores.superficie,
                  borderColor: seleccionado ? colores.primario : colores.borde,
                  borderRadius: radios.l,
                  padding: espaciado.l,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={styles.encabezado}>
                <Text style={styles.icono}>{info.icono}</Text>
                <Text style={[tipografia.tituloMediano, styles.titulo]}>{info.titulo}</Text>
                <Text style={[styles.marca, { color: seleccionado ? colores.primario : colores.textoTenue }]}>
                  {seleccionado ? '✓' : '○'}
                </Text>
              </View>
              <Text style={tipografia.cuerpo}>{info.texto}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ height: espaciado.l }} />
      <Text style={tipografia.pequeno}>Puedes cambiar la intensidad cuando quieras desde Ajustes.</Text>

      <View style={{ height: espaciado.xl }} />
      <Boton titulo="Continuar" onPress={() => navigation.navigate('Permisos')} />
      <Boton titulo="Atrás" onPress={() => navigation.goBack()} variante="texto" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderWidth: 1.5,
    gap: 8,
  },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icono: {
    fontSize: 24,
  },
  titulo: {
    flex: 1,
  },
  marca: {
    fontSize: 22,
    fontWeight: '700',
  },
});
