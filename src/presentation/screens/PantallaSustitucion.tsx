import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Boton, IndicadorProgreso, MensajeCalido, Pantalla, Tarjeta } from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useSustitucionViewModel } from '../viewmodels/useSustitucionViewModel';

type Props = NativeStackScreenProps<RutasRaiz, 'Sustitucion'>;

function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/**
 * Micro-actividad sustituta con temporizador de 2-3 minutos. Al terminar se registra
 * el cumplimiento y se pasa a la celebración. "Hoy no puedo" también es una opción válida.
 */
export function PantallaSustitucion({ route, navigation }: Props) {
  const { habitId, redSocial } = route.params;
  const sustitucion = useSustitucionViewModel(habitId);
  const { tipografia, colores, espaciado } = useTema();
  const habito = sustitucion.habito;

  const irACelebracion = (cumplido: boolean) => {
    if (!habito) {
      navigation.reset({ index: 0, routes: [{ name: 'Principal' }] });
      return;
    }
    navigation.replace('Celebracion', {
      habitId: habito.habitId,
      nombreHabito: habito.nombre,
      duracionMinutos: habito.duracionMinutos,
      cumplido,
      redSocial,
    });
  };

  const completar = async () => {
    await sustitucion.completar();
    irACelebracion(true);
  };

  const abandonar = async () => {
    await sustitucion.abandonar();
    irACelebracion(false);
  };

  if (sustitucion.cargando) {
    return (
      <Pantalla centrado>
        <ActivityIndicator size="large" color={colores.primario} />
      </Pantalla>
    );
  }

  if (!habito) {
    return (
      <Pantalla centrado>
        <MensajeCalido
          icono="🌤️"
          texto="No encontramos ese hábito. Volvamos a tu día con calma."
          tono="neutro"
        />
        <View style={{ height: espaciado.l }} />
        <Boton titulo="Volver" onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Principal' }] })} />
      </Pantalla>
    );
  }

  return (
    <Pantalla centrado>
      <Text style={tipografia.marca}>En vez de {redSocial}</Text>
      <Text style={[tipografia.titulo, { marginTop: espaciado.s }]} accessibilityRole="header">
        {habito.nombre}
      </Text>
      <Text style={[tipografia.subtitulo, { marginTop: espaciado.s }]}>
        Este ratito es tuyo. Si el teléfono se apaga, el tiempo sigue corriendo.
      </Text>

      <Tarjeta estilo={{ marginVertical: espaciado.l }}>
        <View style={styles.temporizador}>
          <Text style={tipografia.numeroGrande}>{formatearTiempo(sustitucion.segundosRestantes)}</Text>
          <Text style={tipografia.etiqueta}>
            {sustitucion.terminado ? 'Tiempo cumplido' : `de ${habito.duracionMinutos} minutos`}
          </Text>
        </View>
        <IndicadorProgreso progreso={sustitucion.progreso} />
      </Tarjeta>

      <View style={styles.acciones}>
        <Boton
          titulo={sustitucion.terminado ? 'Listo, lo hice' : 'Listo, lo hice (al terminar)'}
          onPress={completar}
          deshabilitado={!sustitucion.terminado}
          cargando={sustitucion.guardando}
        />
        <Boton titulo="Hoy no puedo" onPress={abandonar} variante="texto" deshabilitado={sustitucion.guardando} />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  temporizador: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  acciones: {
    gap: 8,
  },
});
