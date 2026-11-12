import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PreguntaNota } from '../../../domain/entities';
import { CampoTexto, MensajeCalido } from '../../components';
import { useTema } from '../../theme/tema';

interface Props {
  pregunta: PreguntaNota;
}

/**
 * Nota libre con una pregunta disparadora. El texto vive solo en el estado de este
 * componente: no se guarda en Firestore, ni en el dispositivo, ni en ningún registro,
 * y desaparece al salir de la pantalla.
 */
export function GuiaNota({ pregunta }: Props) {
  const { tipografia } = useTema();
  const [texto, setTexto] = useState('');

  return (
    <View style={styles.contenedor}>
      <Text style={tipografia.tituloMediano}>{pregunta.pregunta}</Text>
      <CampoTexto
        etiqueta="Tu nota"
        value={texto}
        onChangeText={setTexto}
        placeholder="Escribe lo que quieras, aunque sea una palabra."
        multiline
        textAlignVertical="top"
        autoComplete="off"
        importantForAutofill="no"
        style={styles.campo}
      />
      <MensajeCalido
        icono="🔒"
        titulo="Esto es solo para ti"
        texto="No se guarda en ningún lado y se borra en cuanto termines."
        tono="neutro"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 16,
  },
  campo: {
    minHeight: 150,
    paddingTop: 12,
    lineHeight: 24,
  },
});
