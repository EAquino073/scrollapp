import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AnimacionTranquila, Tarjeta, type VarianteAnimacion } from '../../components';
import { useTema } from '../../theme/tema';

interface Props {
  variante: VarianteAnimacion;
  principal: string;
  detalle: string;
  /** Si existe, el detalle va en una tarjeta con este título (p. ej. el dato del agua). */
  tituloDetalle?: string;
  /** Línea fija de apoyo al pie. */
  nota?: string;
  activo: boolean;
}

/** Mensaje con una animación tranquila: agua, caminata y observación. */
export function GuiaMensaje({ variante, principal, detalle, tituloDetalle, nota, activo }: Props) {
  const { tipografia } = useTema();
  return (
    <View style={styles.contenedor}>
      <AnimacionTranquila variante={variante} activo={activo} />
      <Text style={[tipografia.tituloMediano, styles.centrado]}>{principal}</Text>
      {tituloDetalle ? (
        <Tarjeta tono="secundario">
          <Text style={tipografia.etiqueta}>{tituloDetalle}</Text>
          <Text style={tipografia.cuerpo}>{detalle}</Text>
        </Tarjeta>
      ) : (
        <Text style={[tipografia.subtitulo, styles.centrado]}>{detalle}</Text>
      )}
      {nota ? <Text style={[tipografia.pequeno, styles.centrado]}>{nota}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 18,
  },
  centrado: {
    textAlign: 'center',
  },
});
