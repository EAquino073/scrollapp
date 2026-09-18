import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../theme/tema';

interface Props {
  titulo: string;
  subtitulo?: string;
  /** Texto pequeño en mayúsculas sobre el título (por defecto la marca). */
  marca?: string;
}

/** Encabezado estándar de pantalla: marca, título y subtítulo con espacio para respirar. */
export function EncabezadoPantalla({ titulo, subtitulo, marca = 'ScrollApp' }: Props) {
  const { tipografia, espaciado } = useTema();
  return (
    <View style={[styles.contenedor, { marginBottom: espaciado.l }]}>
      <Text style={[tipografia.marca, { marginBottom: espaciado.m }]}>{marca}</Text>
      <Text style={tipografia.titulo} accessibilityRole="header">
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
    alignItems: 'flex-start',
  },
});
