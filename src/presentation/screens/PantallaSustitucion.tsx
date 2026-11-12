import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { iconoDeHabito, SEGUNDOS_PARA_SALTAR, type ReplacementHabit } from '../../domain/entities';
import type { ContenidoDelBanco, MinijuegoAsignado } from '../../domain/usecases';
import {
  Aparecer,
  Boton,
  IndicadorProgreso,
  MensajeCalido,
  Pantalla,
  Tarjeta,
  TiempoDiscreto,
} from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useSustitucionViewModel, type SustitucionViewModel } from '../viewmodels/useSustitucionViewModel';
import { VistaContenidoGuiado } from './actividades';
import { INSTRUCCIONES_MINIJUEGO, VistaMinijuego } from './minijuegos';

/** Pausa breve tras resolver un minijuego, para ver el tablero terminado. */
const PAUSA_TRAS_RESOLVER_MS = 900;

type Props = NativeStackScreenProps<RutasRaiz, 'Sustitucion'>;

function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${minutos}:${String(resto).padStart(2, '0')}`;
}

/**
 * Micro-actividad sustituta de 2-3 minutos. Al terminar se registra el cumplimiento y se
 * pasa a la celebración. "Hoy no puedo" también es una opción válida.
 * - Actividad predeterminada: contenido guiado del banco local (fase 5), con el tiempo
 *   indicado de forma discreta y "Terminé" disponible desde el inicio.
 * - «Un reto para la mente»: alterna un acertijo y un minijuego. El minijuego no muestra
 *   tiempo; al resolverse pasa a la celebración y «Saltar» aparece al minuto.
 * - Hábito propio del usuario: el temporizador cálido de siempre.
 */
export function PantallaSustitucion({ route, navigation }: Props) {
  const { habitId, redSocial } = route.params;
  const sustitucion = useSustitucionViewModel(habitId);
  const { colores, espaciado } = useTema();
  const habito = sustitucion.habito;

  const irACelebracion = (cumplido: boolean, saltado = false) => {
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
      saltado,
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

  const saltar = async () => {
    await sustitucion.abandonar();
    irACelebracion(false, true);
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

  if (sustitucion.asignacion?.tipo === 'MINIJUEGO') {
    return (
      <SustitucionMinijuego
        habito={habito}
        asignacion={sustitucion.asignacion}
        vm={sustitucion}
        redSocial={redSocial}
        onCompletar={completar}
        onAbandonar={saltar}
      />
    );
  }

  if (sustitucion.asignacion) {
    return (
      <SustitucionGuiada
        habito={habito}
        asignacion={sustitucion.asignacion}
        vm={sustitucion}
        redSocial={redSocial}
        onCompletar={completar}
        onAbandonar={abandonar}
      />
    );
  }

  return (
    <SustitucionConTemporizador
      habito={habito}
      vm={sustitucion}
      redSocial={redSocial}
      onCompletar={completar}
      onAbandonar={abandonar}
    />
  );
}

interface PropsVista {
  habito: ReplacementHabit;
  vm: SustitucionViewModel;
  redSocial: string;
  onCompletar(): void;
  onAbandonar(): void;
}

function Encabezado({ habito, redSocial }: { habito: ReplacementHabit; redSocial: string }) {
  const { tipografia, espaciado } = useTema();
  return (
    <View>
      <Text style={tipografia.marca}>En vez de {redSocial}</Text>
      <Text style={[tipografia.titulo, { marginTop: espaciado.s }]} accessibilityRole="header">
        {iconoDeHabito(habito.tipoActividad)} {habito.nombre}
      </Text>
    </View>
  );
}

/** Actividad predeterminada con contenido guiado. */
function SustitucionGuiada({
  habito,
  asignacion,
  vm,
  redSocial,
  onCompletar,
  onAbandonar,
}: PropsVista & { asignacion: ContenidoDelBanco }) {
  const { espaciado } = useTema();
  return (
    <Pantalla centrado>
      <Encabezado habito={habito} redSocial={redSocial} />
      <View style={{ marginVertical: espaciado.l }}>
        <VistaContenidoGuiado
          asignacion={asignacion}
          segundosTranscurridos={vm.segundosTranscurridos}
          terminado={vm.terminado}
        />
      </View>
      <View style={[styles.acciones, { marginTop: espaciado.s }]}>
        <TiempoDiscreto segundosTranscurridos={vm.segundosTranscurridos} segundosTotales={vm.segundosTotales} />
        <Boton titulo="Terminé" onPress={onCompletar} cargando={vm.guardando} estilo={{ marginTop: espaciado.s }} />
        <Boton titulo="Hoy no puedo" onPress={onAbandonar} variante="texto" deshabilitado={vm.guardando} />
      </View>
    </Pantalla>
  );
}

/**
 * Minijuego de «Un reto para la mente»: sin tiempo visible, sin puntaje. Al resolverse se
 * registra como cumplido; «Saltar» aparece al minuto y se registra como no cumplido, con un
 * mensaje neutro. `onAbandonar` aquí es saltar.
 */
function SustitucionMinijuego({
  habito,
  asignacion,
  vm,
  redSocial,
  onCompletar,
  onAbandonar,
}: PropsVista & { asignacion: MinijuegoAsignado }) {
  const { tipografia, espaciado } = useTema();
  const [resuelto, setResuelto] = useState(false);
  // La pantalla se redibuja cada medio segundo: la continuación se lee por referencia para
  // que la pausa tras resolver no se reinicie.
  const completarRef = useRef(onCompletar);
  useEffect(() => {
    completarRef.current = onCompletar;
  }, [onCompletar]);

  // Estable, para que el tablero (memo) no se redibuje con cada segundo.
  const alResolver = useCallback(() => setResuelto(true), []);

  useEffect(() => {
    if (!resuelto) {
      return;
    }
    const espera = setTimeout(() => completarRef.current(), PAUSA_TRAS_RESOLVER_MS);
    return () => clearTimeout(espera);
  }, [resuelto]);

  const puedeSaltar = !resuelto && vm.segundosTranscurridos >= SEGUNDOS_PARA_SALTAR;

  return (
    <Pantalla centrado>
      <Encabezado habito={habito} redSocial={redSocial} />
      <Text style={[tipografia.subtitulo, { marginTop: espaciado.s }]}>
        {INSTRUCCIONES_MINIJUEGO[asignacion.minijuego.juego]}
      </Text>
      <View style={{ marginVertical: espaciado.l }}>
        <VistaMinijuego minijuego={asignacion.minijuego} onResuelto={alResolver} />
      </View>
      <View style={styles.pieMinijuego}>
        {resuelto ? (
          <Aparecer>
            <MensajeCalido icono="🌿" texto="Resuelto. Tómate un segundo para verlo." tono="secundario" />
          </Aparecer>
        ) : puedeSaltar ? (
          <Aparecer>
            <Boton titulo="Saltar" onPress={onAbandonar} variante="texto" deshabilitado={vm.guardando} />
          </Aparecer>
        ) : null}
      </View>
    </Pantalla>
  );
}

/** Hábito propio del usuario: solo el temporizador cálido. */
function SustitucionConTemporizador({ habito, vm, redSocial, onCompletar, onAbandonar }: PropsVista) {
  const { tipografia, espaciado } = useTema();
  return (
    <Pantalla centrado>
      <Encabezado habito={habito} redSocial={redSocial} />
      <Text style={[tipografia.subtitulo, { marginTop: espaciado.s }]}>
        Este ratito es tuyo. Si el teléfono se apaga, el tiempo sigue corriendo.
      </Text>

      <Tarjeta estilo={{ marginVertical: espaciado.l }}>
        <View style={styles.temporizador}>
          <Text style={tipografia.numeroGrande}>{formatearTiempo(vm.segundosRestantes)}</Text>
          <Text style={tipografia.etiqueta}>
            {vm.terminado ? 'Tiempo cumplido' : `de ${habito.duracionMinutos} minutos`}
          </Text>
        </View>
        <IndicadorProgreso progreso={vm.progreso} />
      </Tarjeta>

      <View style={styles.acciones}>
        <Boton
          titulo={vm.terminado ? 'Listo, lo hice' : 'Listo, lo hice (al terminar)'}
          onPress={onCompletar}
          deshabilitado={!vm.terminado}
          cargando={vm.guardando}
        />
        <Boton titulo="Hoy no puedo" onPress={onAbandonar} variante="texto" deshabilitado={vm.guardando} />
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
  pieMinijuego: {
    minHeight: 56,
    justifyContent: 'center',
  },
});
