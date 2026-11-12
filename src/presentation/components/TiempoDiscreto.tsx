import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTema } from '../theme/tema';
import { IndicadorProgreso } from './IndicadorProgreso';

interface Props {
  segundosTranscurridos: number;
  segundosTotales: number;
}

function textoTiempo(restantes: number): string {
  if (restantes <= 0) {
    return 'Tiempo cumplido. Puedes seguir, si te apetece.';
  }
  if (restantes < 60) {
    return 'Queda menos de un minuto';
  }
  const minutos = Math.ceil(restantes / 60);
  return minutos === 1 ? 'Queda cerca de un minuto' : `Quedan unos ${minutos} minutos`;
}

/**
 * Indicación discreta del tiempo en las actividades guiadas: una barra fina y un texto
 * pequeño en minutos aproximados. Acompaña sin presionar: no hay cuenta regresiva.
 */
export function TiempoDiscreto({ segundosTranscurridos, segundosTotales }: Props) {
  const { tipografia, colores } = useTema();
  const restantes = Math.max(0, segundosTotales - segundosTranscurridos);
  return (
    <View style={styles.contenedor} accessibilityRole="timer" accessibilityLabel={textoTiempo(restantes)}>
      <IndicadorProgreso
        progreso={segundosTotales > 0 ? segundosTranscurridos / segundosTotales : 0}
        grosor={4}
        color={colores.secundario}
      />
      <Text style={[tipografia.pequeno, styles.texto]}>{textoTiempo(restantes)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 6,
  },
  texto: {
    textAlign: 'center',
  },
});
