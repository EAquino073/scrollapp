import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PatronRespiracion } from '../../../domain/entities';
import { Aparecer, MensajeCalido, RespiracionGuiada } from '../../components';
import { useTema } from '../../theme/tema';

interface Props {
  patron: PatronRespiracion;
  /** Se detiene al cumplirse los dos minutos. */
  activo: boolean;
}

/** Respiración guiada con el patrón del banco: el círculo crece, se sostiene y se contrae. */
export function GuiaRespiracion({ patron, activo }: Props) {
  const { tipografia } = useTema();
  return (
    <View style={styles.contenedor}>
      <View style={styles.cabecera}>
        <Text style={[tipografia.tituloMediano, styles.centrado]}>{patron.nombre}</Text>
        <Text style={[tipografia.subtitulo, styles.centrado]}>{patron.descripcion}</Text>
      </View>
      <RespiracionGuiada patron={patron} activo={activo} mostrarSegundos grande />
      {!activo ? (
        <Aparecer>
          <MensajeCalido
            icono="🌿"
            texto="Listo. Deja que la respiración vuelva sola a su ritmo."
            tono="secundario"
          />
        </Aparecer>
      ) : null}
      <Text style={[tipografia.pequeno, styles.centrado]}>
        Si algún tiempo te incomoda, respira a tu ritmo. No hay una forma incorrecta.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 20,
  },
  cabecera: {
    gap: 6,
  },
  centrado: {
    textAlign: 'center',
  },
});
