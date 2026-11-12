import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CategoriaLectura, Lectura } from '../../../domain/entities';
import { useTema } from '../../theme/tema';

interface Props {
  lectura: Lectura;
}

const ETIQUETAS: Record<CategoriaLectura, string> = {
  ciencia: 'Ciencia',
  historia: 'Historia',
  naturaleza: 'Naturaleza',
  lenguaje: 'Lenguaje',
  curiosidades: 'Curiosidades',
  relato: 'Un relato breve',
};

/**
 * Lectura breve con texto cómodo: letra grande, interlineado amplio y párrafos
 * separados. Respeta el tamaño de letra que la persona tenga configurado en el sistema.
 */
export function GuiaLectura({ lectura }: Props) {
  const { tipografia, colores } = useTema();
  const parrafos = lectura.texto.split('\n\n');

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={tipografia.marca}>{ETIQUETAS[lectura.categoria]}</Text>
        <Text style={tipografia.tituloMediano} accessibilityRole="header">
          {lectura.titulo}
        </Text>
      </View>
      {parrafos.map((parrafo, i) => (
        <Text key={i} style={[styles.parrafo, { color: colores.texto }]}>
          {parrafo}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 14,
  },
  cabecera: {
    gap: 6,
    marginBottom: 4,
  },
  parrafo: {
    fontSize: 18,
    lineHeight: 29,
  },
});
