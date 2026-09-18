import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../theme/tema';
import { IndicadorProgreso } from './IndicadorProgreso';

export const TOTAL_PASOS_ONBOARDING = 8;

interface Props {
  paso: number;
  titulo: string;
  subtitulo?: string;
}

/** Encabezado de cada paso del onboarding: progreso, título y explicación breve. */
export function EncabezadoOnboarding({ paso, titulo, subtitulo }: Props) {
  const { tipografia, espaciado } = useTema();
  return (
    <View style={[styles.contenedor, { marginBottom: espaciado.l }]}>
      <IndicadorProgreso
        progreso={paso / TOTAL_PASOS_ONBOARDING}
        detalle={`Paso ${paso} de ${TOTAL_PASOS_ONBOARDING}`}
        grosor={6}
      />
      <Text style={[tipografia.titulo, { marginTop: espaciado.l }]} accessibilityRole="header">
        {titulo}
      </Text>
      {subtitulo ? (
        <Text style={[tipografia.subtitulo, { marginTop: espaciado.s }]}>{subtitulo}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'stretch',
  },
});
