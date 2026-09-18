import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTema } from '../theme/tema';

interface Props extends TextInputProps {
  etiqueta: string;
  /** Mensaje de error, siempre en tono amable. */
  error?: string | null;
  /** Texto de ayuda debajo del campo. */
  ayuda?: string;
}

/** Campo de texto con etiqueta, ayuda y error. El borde se acentúa al enfocar. */
export function CampoTexto({ etiqueta, error, ayuda, style, ...props }: Props) {
  const { colores, radios, espaciado, tipografia } = useTema();
  const [enfocado, setEnfocado] = useState(false);

  const colorBorde = error ? colores.aviso : enfocado ? colores.primario : colores.borde;

  return (
    <View style={styles.contenedor}>
      <Text style={tipografia.etiqueta}>{etiqueta}</Text>
      <TextInput
        {...props}
        onFocus={e => {
          setEnfocado(true);
          props.onFocus?.(e);
        }}
        onBlur={e => {
          setEnfocado(false);
          props.onBlur?.(e);
        }}
        placeholderTextColor={colores.textoTenue}
        style={[
          styles.campo,
          {
            borderColor: colorBorde,
            borderRadius: radios.m,
            backgroundColor: colores.superficieSuave,
            color: colores.texto,
            paddingHorizontal: espaciado.m,
          },
          style,
        ]}
        accessibilityLabel={etiqueta}
      />
      {error ? (
        <Text style={[tipografia.pequeno, { color: colores.aviso }]}>{error}</Text>
      ) : ayuda ? (
        <Text style={tipografia.pequeno}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: 6,
  },
  campo: {
    borderWidth: 1.5,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 50,
  },
});
