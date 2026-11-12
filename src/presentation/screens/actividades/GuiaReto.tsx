import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RetoMental, TipoRetoMental } from '../../../domain/entities';
import { Aparecer, Boton, MensajeCalido, Tarjeta } from '../../components';
import { useTema } from '../../theme/tema';

interface Props {
  reto: RetoMental;
}

const ETIQUETAS: Record<TipoRetoMental, string> = {
  adivinanza: 'Adivinanza',
  acertijo: 'Acertijo',
  logica: 'Un poco de lógica',
};

/** Acertijo con pista opcional y respuesta que se revela al tocar. Sin puntaje ni prisa. */
export function GuiaReto({ reto }: Props) {
  const { tipografia } = useTema();
  const [verPista, setVerPista] = useState(false);
  const [verRespuesta, setVerRespuesta] = useState(false);

  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={tipografia.marca}>{ETIQUETAS[reto.tipo]}</Text>
        <Text style={[tipografia.tituloMediano, styles.pregunta]}>{reto.pregunta}</Text>
        <Text style={tipografia.pequeno}>Piénsalo con calma. No hay prisa ni puntaje.</Text>
      </View>

      {verPista ? (
        <Aparecer>
          <MensajeCalido icono="💡" titulo="Una pista" texto={reto.pista} tono="acento" />
        </Aparecer>
      ) : null}

      {verRespuesta ? (
        <Aparecer>
          <Tarjeta tono="secundario">
            <Text style={tipografia.etiqueta}>La respuesta</Text>
            <Text style={tipografia.tituloMediano}>{reto.respuesta}</Text>
            {reto.explicacion ? <Text style={tipografia.cuerpo}>{reto.explicacion}</Text> : null}
          </Tarjeta>
        </Aparecer>
      ) : (
        <View style={styles.acciones}>
          {!verPista ? (
            <Boton titulo="Ver una pista" variante="secundario" onPress={() => setVerPista(true)} />
          ) : null}
          <Boton titulo="Ver la respuesta" variante="texto" onPress={() => setVerRespuesta(true)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 16,
  },
  cabecera: {
    gap: 8,
  },
  pregunta: {
    lineHeight: 30,
  },
  acciones: {
    gap: 4,
  },
});
