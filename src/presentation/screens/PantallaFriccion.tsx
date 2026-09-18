import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { iconoDeHabito } from '../../domain/entities';
import { Boton, MensajeCalido, Pantalla, RespiracionGuiada, Tarjeta } from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useFriccionViewModel } from '../viewmodels/useFriccionViewModel';

type Props = NativeStackScreenProps<RutasRaiz, 'Friccion'>;

/**
 * Pausa de fricción. Aparece encima de la red social detectada y respeta el modo de
 * intensidad: SUAVE (3 s, solo mensaje), MEDIO (8 s, mensaje + una actividad sugerida),
 * FUERTE (15 s, mensaje + actividad + respiración guiada).
 * El mensaje rota entre la motivación del usuario, una frase suave y un dato propio;
 * nunca pregunta ni confronta. Nunca bloquea: Continuar siempre está visible.
 */
export function PantallaFriccion({ route, navigation }: Props) {
  const { paquete, redSocial } = route.params;
  const friccion = useFriccionViewModel(paquete, redSocial);
  const { tipografia, colores, espaciado } = useTema();

  const continuar = async () => {
    await friccion.continuar();
    navigation.reset({ index: 0, routes: [{ name: 'Principal' }] });
  };

  const sustituir = async () => {
    const habito = await friccion.sustituir();
    if (habito) {
      navigation.replace('Sustitucion', { paquete, redSocial, habitId: habito.habitId });
    }
  };

  const ofreceHabito = friccion.modo !== 'SUAVE';

  return (
    <Pantalla centrado>
      <View style={styles.contenido}>
        <Text style={tipografia.marca}>Un momento</Text>

        <Text style={[tipografia.titulo, styles.mensaje]} accessibilityRole="header">
          {friccion.mensaje?.texto ?? 'Un segundo de calma antes de la pantalla.'}
        </Text>
        {friccion.mensaje?.apoyo ? (
          <Text style={tipografia.subtitulo}>{friccion.mensaje.apoyo}</Text>
        ) : null}

        <View style={[styles.pausa, { marginVertical: espaciado.l }]}>
          {friccion.modo === 'FUERTE' && !friccion.pausaTerminada ? (
            <RespiracionGuiada />
          ) : (
            <Text style={[tipografia.numeroGrande, { color: colores.primario }]}>
              {friccion.pausaTerminada ? '✓' : friccion.segundosRestantes}
            </Text>
          )}
          <Text style={tipografia.pequeno}>
            {friccion.pausaTerminada
              ? 'La pausa terminó. Tú decides.'
              : `Una pausa de ${friccion.segundosTotales} segundos, según tu modo ${friccion.modo.toLowerCase()}.`}
          </Text>
        </View>

        {ofreceHabito && (
          <View style={{ marginBottom: espaciado.l }}>
            {friccion.cargandoHabito ? (
              <ActivityIndicator color={colores.primario} />
            ) : friccion.habitoSugerido ? (
              <Tarjeta tono="secundario">
                <Text style={tipografia.etiqueta}>Otra opción, si te apetece</Text>
                <View style={styles.filaActividad}>
                  <Text style={styles.icono}>{iconoDeHabito(friccion.habitoSugerido.tipoActividad)}</Text>
                  <Text style={[tipografia.tituloMediano, styles.nombreActividad]}>
                    {friccion.habitoSugerido.nombre}
                  </Text>
                </View>
                <Text style={tipografia.etiqueta}>
                  Son {friccion.habitoSugerido.duracionMinutos} minutos. {redSocial} va a seguir ahí después.
                </Text>
                {friccion.puedeCambiarHabito ? (
                  <Boton
                    titulo="Otra actividad"
                    onPress={friccion.otraActividad}
                    variante="texto"
                    ancho={false}
                  />
                ) : null}
              </Tarjeta>
            ) : (
              <MensajeCalido
                icono="🌱"
                texto="Todavía no tienes actividades activas. Cuando las tengas, aquí te ofreceremos una."
                tono="neutro"
              />
            )}
          </View>
        )}

        <View style={styles.acciones}>
          {ofreceHabito && friccion.habitoSugerido && (
            <Boton
              titulo={`Mejor ${friccion.habitoSugerido.nombre.toLowerCase()}`}
              onPress={sustituir}
              cargando={friccion.procesando}
            />
          )}
          <Boton
            titulo={
              friccion.pausaTerminada
                ? `Continuar a ${redSocial}`
                : `Continuar a ${redSocial} (${friccion.segundosRestantes})`
            }
            onPress={continuar}
            variante={ofreceHabito && friccion.habitoSugerido ? 'secundario' : 'primario'}
            deshabilitado={!friccion.pausaTerminada}
            cargando={friccion.procesando && friccion.pausaTerminada}
          />
        </View>
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  contenido: {
    gap: 8,
  },
  mensaje: {
    marginTop: 8,
  },
  pausa: {
    alignItems: 'center',
    gap: 8,
  },
  filaActividad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icono: {
    fontSize: 28,
  },
  nombreActividad: {
    flex: 1,
  },
  acciones: {
    gap: 12,
  },
});
