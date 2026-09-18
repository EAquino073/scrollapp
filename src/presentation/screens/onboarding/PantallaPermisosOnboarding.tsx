import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Boton, EncabezadoOnboarding, MensajeCalido, Pantalla, Tarjeta } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useOnboarding } from '../../viewmodels/OnboardingContext';

type Props = NativeStackScreenProps<RutasOnboarding, 'Permisos'>;

interface PermisoProps {
  numero: number;
  titulo: string;
  porQue: string;
  concedido: boolean;
  textoAccion: string;
  accion: () => void;
}

function Permiso({ numero, titulo, porQue, concedido, textoAccion, accion }: PermisoProps) {
  const { tipografia, colores } = useTema();
  return (
    <Tarjeta tono={concedido ? 'secundario' : 'superficie'} compacta>
      <View style={styles.fila}>
        <Text style={[styles.marca, { color: concedido ? colores.secundario : colores.textoTenue }]}>
          {concedido ? '✓' : String(numero)}
        </Text>
        <View style={styles.texto}>
          <Text style={tipografia.cuerpoFuerte}>{titulo}</Text>
          <Text style={tipografia.etiqueta}>{porQue}</Text>
        </View>
      </View>
      {concedido ? (
        <Text style={[tipografia.pequeno, { color: colores.secundario }]}>Concedido. Gracias.</Text>
      ) : (
        <Boton titulo={textoAccion} onPress={accion} variante="secundario" />
      )}
    </Tarjeta>
  );
}

/** Paso 7: los tres permisos, explicados y solicitados uno por uno. */
export function PantallaPermisosOnboarding({ navigation }: Props) {
  const { permisos, abrirPermisoUso, abrirSuperposicion, solicitarBateria, refrescarPermisos } = useOnboarding();
  const { espaciado, tipografia } = useTema();
  const [intento, setIntento] = useState(false);

  const todos = !!permisos && permisos.accesoUso && permisos.superposicion && permisos.exentoBateria;

  const continuar = () => {
    refrescarPermisos();
    if (!todos) {
      setIntento(true);
      return;
    }
    navigation.navigate('Cierre');
  };

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={7}
        titulo="Tres permisos para acompañarte"
        subtitulo="Android los pide en sus propios Ajustes. Cuando vuelvas a la app, verás cada uno marcado."
      />

      <View style={{ gap: espaciado.m }}>
        <Permiso
          numero={1}
          titulo="Acceso a datos de uso"
          porQue="Es lo que nos permite saber cuándo abres una red social y cuánto tiempo pasas en ella. Sin esto, no hay acompañamiento."
          concedido={permisos?.accesoUso ?? false}
          textoAccion="Abrir Ajustes de uso"
          accion={abrirPermisoUso}
        />
        <Permiso
          numero={2}
          titulo="Mostrar sobre otras apps"
          porQue="Para que la pausa aparezca encima de la red social en el momento justo, y no después."
          concedido={permisos?.superposicion ?? false}
          textoAccion="Abrir Ajustes de superposición"
          accion={abrirSuperposicion}
        />
        <Permiso
          numero={3}
          titulo="Sin optimización de batería"
          porQue="Para que el sistema no apague el acompañamiento en segundo plano. El consumo es mínimo: solo miramos con la pantalla encendida."
          concedido={permisos?.exentoBateria ?? false}
          textoAccion="Permitir"
          accion={solicitarBateria}
        />
      </View>

      {intento && !todos ? (
        <View style={{ marginTop: espaciado.m }}>
          <MensajeCalido
            icono="🙏"
            texto="Nos faltan uno o más permisos. Sin ellos la app no puede acompañarte; cuando los concedas, aquí aparecerán marcados y podrás seguir."
            tono="acento"
          />
        </View>
      ) : null}

      <View style={{ height: espaciado.l }} />
      <Text style={tipografia.pequeno}>Si un permiso no aparece marcado al volver, toca "Ya los concedí" para revisarlo de nuevo.</Text>

      <View style={{ height: espaciado.xl }} />
      <Boton titulo={todos ? 'Continuar' : 'Ya los concedí'} onPress={continuar} />
      <Boton titulo="Atrás" onPress={() => navigation.goBack()} variante="texto" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  marca: {
    fontSize: 22,
    fontWeight: '700',
    width: 28,
    textAlign: 'center',
  },
  texto: {
    flex: 1,
    gap: 4,
  },
});
