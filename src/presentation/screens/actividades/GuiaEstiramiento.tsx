import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Estiramiento } from '../../../domain/entities';
import { Aparecer, IndicadorProgreso, MensajeCalido, Tarjeta } from '../../components';
import { useTema } from '../../theme/tema';

interface Props {
  estiramiento: Estiramiento;
  segundosTranscurridos: number;
}

/** Paso en curso según el tiempo transcurrido: los pasos avanzan solos. */
function pasoActual(estiramiento: Estiramiento, segundos: number) {
  let acumulado = 0;
  for (let i = 0; i < estiramiento.pasos.length; i++) {
    const duracion = estiramiento.pasos[i].segundos;
    if (segundos < acumulado + duracion) {
      return { indice: i, avance: (segundos - acumulado) / duracion };
    }
    acumulado += duracion;
  }
  return { indice: estiramiento.pasos.length, avance: 1 };
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Estiramiento guiado: tres pasos con avance automático según la duración de cada uno. */
export function GuiaEstiramiento({ estiramiento, segundosTranscurridos }: Props) {
  const { tipografia, colores } = useTema();
  const { pasos } = estiramiento;
  const { indice, avance } = pasoActual(estiramiento, segundosTranscurridos);
  const completo = indice >= pasos.length;
  const paso = pasos[Math.min(indice, pasos.length - 1)];

  return (
    <View style={styles.contenedor}>
      <Text style={[tipografia.etiqueta, styles.centrado]}>{estiramiento.titulo}</Text>

      {completo ? (
        <Aparecer key="completo">
          <MensajeCalido
            icono="🌿"
            titulo="Secuencia completa"
            texto="Quédate un momento así, como estés. Cuando quieras, termina."
            tono="secundario"
          />
        </Aparecer>
      ) : (
        <Aparecer key={indice}>
          <Tarjeta>
            <View style={styles.filaPaso}>
              <Text style={tipografia.marca}>
                Paso {indice + 1} de {pasos.length}
              </Text>
              <Text style={tipografia.pequeno}>{capitalizar(paso.parteCuerpo)}</Text>
            </View>
            <Text style={[tipografia.tituloMediano, styles.instruccion]}>{paso.instruccion}</Text>
            <IndicadorProgreso progreso={avance} grosor={6} />
          </Tarjeta>
        </Aparecer>
      )}

      <View style={styles.puntos} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {pasos.map((_, i) => (
          <View
            key={i}
            style={[
              styles.punto,
              {
                backgroundColor:
                  i < indice ? colores.secundario : i === indice ? colores.primario : colores.borde,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[tipografia.pequeno, styles.centrado]}>
        Sin forzar: solo hasta donde sea cómodo. Los pasos avanzan solos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 16,
  },
  filaPaso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  instruccion: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    marginVertical: 4,
  },
  puntos: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  punto: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  centrado: {
    textAlign: 'center',
  },
});
