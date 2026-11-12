import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { generarCelebracion, generarMensajeNoCompletado, generarMensajeSalto } from '../../domain/usecases';
import { Boton, MensajeCalido, Pantalla } from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';

type Props = NativeStackScreenProps<RutasRaiz, 'Celebracion'>;

/**
 * Micro-celebración específica tras la micro-actividad: nombra el hábito realizado.
 * Si no se completó, el mensaje es igual de amable: se registra el patrón, no la culpa.
 * Si se saltó un minijuego, el mensaje es neutro.
 */
export function PantallaCelebracion({ route, navigation }: Props) {
  const { habitId, nombreHabito, duracionMinutos, cumplido, redSocial, saltado = false } = route.params;
  const { tipografia, espaciado } = useTema();

  const celebracion = useMemo(() => {
    const habito = { habitId, nombre: nombreHabito, duracionMinutos };
    if (cumplido) {
      return generarCelebracion(habito, redSocial);
    }
    return saltado ? generarMensajeSalto(redSocial) : generarMensajeNoCompletado(habito, redSocial);
  }, [cumplido, duracionMinutos, habitId, nombreHabito, redSocial, saltado]);

  return (
    <Pantalla centrado>
      <View style={styles.contenido}>
        <Text style={styles.icono}>{celebracion.icono}</Text>
        <Text style={[tipografia.titulo, styles.centrado]} accessibilityRole="header">
          {celebracion.titulo}
        </Text>
        <View style={{ marginVertical: espaciado.l }}>
          <MensajeCalido texto={celebracion.texto} tono={cumplido ? 'acento' : 'neutro'} />
        </View>
        <Boton
          titulo="Volver a mi día"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Principal' }] })}
        />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: {
    alignItems: 'stretch',
    gap: 8,
  },
  icono: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: 8,
  },
  centrado: {
    textAlign: 'center',
  },
});
