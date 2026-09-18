import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import {
  Boton,
  Chip,
  EncabezadoPantalla,
  IndicadorProgreso,
  MensajeCalido,
  Pantalla,
  Tarjeta,
} from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useRevisionSemanalViewModel } from '../viewmodels/useRevisionSemanalViewModel';
import { useSesion } from '../viewmodels/SesionContext';

type Props = NativeStackScreenProps<RutasRaiz, 'RevisionSemanal'>;

/**
 * Revisión semanal: el patrón completo de la semana, no solo los fallos.
 * Si hubo buen cumplimiento, muestra una micro-celebración específica; si no, presenta
 * el progreso acumulado sin reiniciar nada en cero.
 */
export function PantallaRevisionSemanal({ route, navigation }: Props) {
  const vm = useRevisionSemanalViewModel(route.params?.numeroSemana);
  const { usuario } = useSesion();
  const { tipografia, colores, espaciado } = useTema();
  const revision = vm.revision;

  if (vm.cargando && !revision) {
    return (
      <Pantalla centrado>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={[tipografia.etiqueta, styles.centrado, { marginTop: espaciado.m }]}>
          Repasando tu semana…
        </Text>
      </Pantalla>
    );
  }

  if (!revision) {
    return (
      <Pantalla>
        <EncabezadoPantalla
          titulo="Tu revisión semanal"
          subtitulo="Aquí verás cómo fue cada semana completa."
        />
        <MensajeCalido
          icono="🌱"
          titulo="Todavía no cierras tu primera semana"
          texto={
            vm.error ??
            'Cuando termine tu primera semana de observación, aquí aparecerá tu punto de partida y la meta que sale de tu propio ritmo.'
          }
          tono="secundario"
        />
        <View style={{ height: espaciado.l }} />
        <Boton titulo="Volver" onPress={() => navigation.goBack()} variante="secundario" />
      </Pantalla>
    );
  }

  const stats = revision.stats;

  return (
    <Pantalla>
      <EncabezadoPantalla
        titulo={`Tu semana ${stats.numeroSemana}`}
        subtitulo="Esto es un retrato de la semana entera, no una calificación."
      />

      {vm.semanasDisponibles.length > 1 ? (
        <View style={[styles.chips, { marginBottom: espaciado.m }]}>
          {vm.semanasDisponibles.map(semana => (
            <Chip
              key={semana}
              etiqueta={`Semana ${semana}`}
              seleccionado={vm.semanaSeleccionada === semana}
              onPress={() => vm.seleccionarSemana(semana)}
            />
          ))}
        </View>
      ) : null}

      <MensajeCalido
        icono={revision.patron.icono}
        titulo={revision.patron.titulo}
        texto={revision.patron.texto}
        tono="secundario"
      />

      {revision.celebracion ? (
        <View style={{ marginTop: espaciado.m }}>
          <MensajeCalido
            icono={revision.celebracion.icono}
            titulo={revision.celebracion.titulo}
            texto={revision.celebracion.texto}
            tono="acento"
          />
        </View>
      ) : null}

      <View style={{ height: espaciado.m }} />

      <Tarjeta>
        <Text style={tipografia.etiqueta}>Cómo fue la semana</Text>
        <View style={styles.resumen}>
          <View style={styles.dato}>
            <Text style={tipografia.numeroGrande}>{stats.minutosScrollPromedio}</Text>
            <Text style={tipografia.etiqueta}>min al día</Text>
          </View>
          <View style={styles.dato}>
            <Text style={tipografia.numeroGrande}>{stats.diasActivos}</Text>
            <Text style={tipografia.etiqueta}>días con datos</Text>
          </View>
          <View style={styles.dato}>
            <Text style={tipografia.numeroGrande}>{revision.habitosCompletados}</Text>
            <Text style={tipografia.etiqueta}>actividades</Text>
          </View>
        </View>

        <View style={[styles.lista, { borderTopColor: colores.borde }]}>
          {revision.porRed.map(red => (
            <View key={red.redSocial} style={styles.filaRed}>
              <Text style={tipografia.cuerpo}>{red.redSocial}</Text>
              <Text style={tipografia.etiqueta}>
                {red.minutosPromedio} min al día
                {red.diasConLimite > 0
                  ? ` · dentro del límite ${red.diasDentroDelLimite} de ${red.diasConLimite} días`
                  : ''}
              </Text>
            </View>
          ))}
          {revision.porRed.length === 0 ? (
            <Text style={tipografia.pequeno}>No hubo uso registrado esta semana.</Text>
          ) : null}
        </View>

        {!revision.esSemanaDeObservacion ? (
          <View style={{ marginTop: espaciado.s, gap: espaciado.s }}>
            <IndicadorProgreso
              progreso={stats.porcentajeCumplimientoLimite / 100}
              etiqueta="Días dentro de tu límite"
              detalle={`${stats.porcentajeCumplimientoLimite}%`}
            />
            <IndicadorProgreso
              progreso={stats.porcentajeCumplimientoHabitos / 100}
              etiqueta="Actividades que empezaste y terminaste"
              detalle={`${stats.porcentajeCumplimientoHabitos}%`}
              color={colores.acento}
            />
          </View>
        ) : null}
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta tono="primario">
        <Text style={tipografia.cuerpoFuerte}>
          {vm.metasVigentes.some(m => m.limiteMinutosDiarios > 0)
            ? `Tu meta para la semana ${vm.semanaActual}`
            : 'Todavía sin meta'}
        </Text>
        {vm.metasVigentes.some(m => m.limiteMinutosDiarios > 0) ? (
          <>
            {vm.metasVigentes
              .filter(m => m.limiteMinutosDiarios > 0)
              .map(meta => (
                <Text key={meta.targetId} style={tipografia.cuerpo}>
                  {meta.redSocial}: hasta {meta.limiteMinutosDiarios} minutos al día
                </Text>
              ))}
            <Text style={tipografia.etiqueta}>
              Sale de tu propio promedio de la semana pasada, menos un 10 %. No es un número ajeno.
            </Text>
          </>
        ) : (
          <Text style={tipografia.etiqueta}>
            Seguimos observando tu ritmo. La meta aparece cuando cierre la semana de observación.
          </Text>
        )}
      </Tarjeta>

      {usuario?.motivacionPersonal ? (
        <View style={{ marginTop: espaciado.m }}>
          <MensajeCalido icono="💛" titulo="Por esto empezaste" texto={usuario.motivacionPersonal} />
        </View>
      ) : null}

      <View style={{ height: espaciado.l }} />
      <Boton titulo="Volver" onPress={() => navigation.goBack()} variante="secundario" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  centrado: { textAlign: 'center' },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  resumen: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 4,
  },
  dato: {
    alignItems: 'flex-start',
  },
  lista: {
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 8,
    gap: 10,
  },
  filaRed: {
    gap: 2,
  },
});
