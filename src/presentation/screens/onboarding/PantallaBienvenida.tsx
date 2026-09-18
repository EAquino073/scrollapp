import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Boton, EncabezadoOnboarding, Pantalla, Tarjeta } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useSesion } from '../../viewmodels/SesionContext';

type Props = NativeStackScreenProps<RutasOnboarding, 'Bienvenida'>;

const HACE = [
  { icono: '🌤️', texto: 'Te hace una pregunta breve antes de abrir una red social, para que decidas tú.' },
  { icono: '🍃', texto: 'Te ofrece una micro-actividad de dos o tres minutos como alternativa al scroll.' },
  { icono: '🌱', texto: 'Te muestra tu propio ritmo y tu avance, siempre comparado contigo, no con nadie más.' },
];

const NO_HACE = [
  { icono: '🔓', texto: 'No bloquea ninguna app. Siempre puedes continuar.' },
  { icono: '🤍', texto: 'No juzga ni regaña. Un mal día no borra nada.' },
  { icono: '🔒', texto: 'No comparte datos personales: en el estudio solo existe tu código de participante.' },
];

/** Paso 1: qué hace la app y qué no hace. */
export function PantallaBienvenida({ navigation }: Props) {
  const { tipografia, espaciado } = useTema();
  const sesion = useSesion();

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={1}
        titulo="Qué bueno que estés aquí"
        subtitulo="ScrollApp te acompaña a usar tus redes con más intención. Antes de empezar, dos cosas claras."
      />

      <Tarjeta tono="secundario">
        <Text style={tipografia.cuerpoFuerte}>Lo que sí hace</Text>
        {HACE.map(item => (
          <View key={item.texto} style={styles.fila}>
            <Text style={styles.icono}>{item.icono}</Text>
            <Text style={[tipografia.cuerpo, styles.texto]}>{item.texto}</Text>
          </View>
        ))}
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta tono="suave">
        <Text style={tipografia.cuerpoFuerte}>Lo que no hace</Text>
        {NO_HACE.map(item => (
          <View key={item.texto} style={styles.fila}>
            <Text style={styles.icono}>{item.icono}</Text>
            <Text style={[tipografia.cuerpo, styles.texto]}>{item.texto}</Text>
          </View>
        ))}
      </Tarjeta>

      <View style={{ height: espaciado.xl }} />

      <Boton titulo="Empecemos" onPress={() => navigation.navigate('DatosEstudio')} />
      <Text style={[tipografia.pequeno, styles.pie, { marginTop: espaciado.m }]}>
        Te tomará unos tres minutos. Puedes cambiar todo después desde Ajustes.
      </Text>
      <Boton titulo="Salir de esta cuenta" onPress={sesion.cerrarSesion} variante="texto" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginTop: 6,
  },
  icono: {
    fontSize: 20,
    lineHeight: 24,
  },
  texto: {
    flex: 1,
  },
  pie: {
    textAlign: 'center',
  },
});
