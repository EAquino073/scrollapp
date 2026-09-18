import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { calcularCumplimiento } from '../../domain/entities';
import { Boton, EncabezadoPantalla, IndicadorProgreso, MensajeCalido, Pantalla, Tarjeta } from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useProgresoViewModel } from '../viewmodels/useProgresoViewModel';
import { useSesion } from '../viewmodels/SesionContext';

const ALTURA_GRAFICA = 130;

/**
 * Pestaña Progreso: trayectoria a largo plazo (minutos promedio por semana y cumplimiento),
 * siempre junto a la motivación personal. El progreso es un patrón acumulado: una semana
 * floja nunca borra lo anterior.
 */
export function PantallaProgreso() {
  const vm = useProgresoViewModel();
  const { usuario } = useSesion();
  const { tipografia, colores, espaciado, radios } = useTema();
  const navegacion = useNavigation<NativeStackNavigationProp<RutasRaiz>>();

  const maximo = Math.max(
    vm.baselineMinutos,
    ...vm.historial.map(s => s.minutosScrollPromedio),
    1,
  );

  return (
    <Pantalla>
      <EncabezadoPantalla
        titulo="Tu camino"
        subtitulo="El progreso aquí se acumula. Un mal día, o una semana floja, no borran lo que ya construiste."
      />

      {usuario?.motivacionPersonal ? (
        <View style={{ marginBottom: espaciado.m }}>
          <MensajeCalido icono="💛" titulo="Por esto empezaste" texto={usuario.motivacionPersonal} tono="acento" />
        </View>
      ) : null}

      {vm.cargando && vm.historial.length === 0 ? (
        <ActivityIndicator color={colores.primario} />
      ) : vm.historial.length === 0 ? (
        <MensajeCalido
          icono="🌱"
          titulo={`Semana ${vm.semanaActual}: todavía estamos observando`}
          texto="Cuando cierre tu primera semana verás aquí tu punto de partida y cómo evoluciona, semana a semana."
          tono="secundario"
        />
      ) : (
        <>
          <Tarjeta>
            <Text style={tipografia.etiqueta}>Minutos al día, semana a semana</Text>
            <View style={[styles.grafica, { height: ALTURA_GRAFICA }]}>
              {vm.baselineMinutos > 0 ? (
                <View style={styles.columna}>
                  <View
                    style={[
                      styles.barra,
                      {
                        height: Math.max(6, (vm.baselineMinutos / maximo) * (ALTURA_GRAFICA - 34)),
                        backgroundColor: colores.textoTenue,
                        borderRadius: radios.s,
                      },
                    ]}
                  />
                  <Text style={tipografia.pequeno}>{vm.baselineMinutos}</Text>
                  <Text style={tipografia.pequeno}>base</Text>
                </View>
              ) : null}
              {vm.historial.map(semana => (
                <View key={semana.statId} style={styles.columna}>
                  <View
                    style={[
                      styles.barra,
                      {
                        height: Math.max(6, (semana.minutosScrollPromedio / maximo) * (ALTURA_GRAFICA - 34)),
                        backgroundColor: semana.numeroSemana === 1 ? colores.acento : colores.secundario,
                        borderRadius: radios.s,
                      },
                    ]}
                  />
                  <Text style={tipografia.pequeno}>{Math.round(semana.minutosScrollPromedio)}</Text>
                  <Text style={tipografia.pequeno}>S{semana.numeroSemana}</Text>
                </View>
              ))}
            </View>
            {vm.diferenciaDesdeBaseline !== null ? (
              <Text style={tipografia.etiqueta}>
                {vm.diferenciaDesdeBaseline < 0
                  ? `Son ${Math.abs(vm.diferenciaDesdeBaseline)} minutos al día menos que cuando empezaste.`
                  : vm.diferenciaDesdeBaseline > 0
                    ? `Ahora mismo estás ${vm.diferenciaDesdeBaseline} minutos al día por encima de tu punto de partida. Sigue siendo parte del camino.`
                    : 'Estás justo en tu punto de partida.'}
              </Text>
            ) : null}
          </Tarjeta>

          <View style={{ height: espaciado.m }} />

          <Tarjeta>
            <Text style={tipografia.etiqueta}>Cumplimiento por semana</Text>
            <View style={{ gap: espaciado.s, marginTop: espaciado.s }}>
              {vm.historial.map(semana => (
                <IndicadorProgreso
                  key={semana.statId}
                  progreso={calcularCumplimiento(semana) / 100}
                  etiqueta={`Semana ${semana.numeroSemana}`}
                  detalle={
                    semana.numeroSemana === 1
                      ? 'observación'
                      : `${Math.round(calcularCumplimiento(semana))}%`
                  }
                  color={semana.numeroSemana === 1 ? colores.acento : colores.secundario}
                />
              ))}
            </View>
            {vm.cumplimientoAcumulado !== null ? (
              <Text style={tipografia.etiqueta}>
                Tu patrón acumulado va en {vm.cumplimientoAcumulado}% de cumplimiento, contando todas las
                semanas con meta.
              </Text>
            ) : null}
          </Tarjeta>

          <View style={{ height: espaciado.m }} />

          <Tarjeta tono="secundario">
            <Text style={tipografia.cuerpoFuerte}>Lo que llevas acumulado</Text>
            <Text style={tipografia.cuerpo}>
              {vm.actividadesCompletadas > 0
                ? `${vm.actividadesCompletadas} ${vm.actividadesCompletadas === 1 ? 'actividad completada' : 'actividades completadas'} en lugar de scroll, a lo largo de ${vm.historial.length} ${vm.historial.length === 1 ? 'semana' : 'semanas'}.`
                : `Llevas ${vm.historial.length} ${vm.historial.length === 1 ? 'semana' : 'semanas'} midiendo tu propio ritmo. Eso ya es información que antes no tenías.`}
            </Text>
          </Tarjeta>

          <View style={{ height: espaciado.m }} />
          <Boton
            titulo="Ver mi revisión semanal"
            onPress={() => navegacion.navigate('RevisionSemanal', {})}
            variante="secundario"
          />
        </>
      )}

      {vm.encuestaDisponible ? (
        <>
          <View style={{ height: espaciado.m }} />
          <Tarjeta tono="acento">
            <Text style={tipografia.cuerpoFuerte}>La encuesta final ya está disponible</Text>
            <Text style={tipografia.etiqueta}>
              Terminaste las seis semanas del estudio. Cuando tengas unos minutos, tu opinión cierra el
              trabajo.
            </Text>
            <Boton titulo="Responder la encuesta" onPress={() => navegacion.navigate('Encuesta')} />
          </Tarjeta>
        </>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  grafica: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginVertical: 8,
  },
  columna: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
  },
  barra: {
    width: '70%',
    minWidth: 14,
  },
});
