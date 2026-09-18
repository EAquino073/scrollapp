import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Boton, EncabezadoOnboarding, MensajeCalido, Pantalla, Tarjeta } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useOnboarding } from '../../viewmodels/OnboardingContext';
import { useSesion } from '../../viewmodels/SesionContext';
import { DESCRIPCION_MODOS } from './PantallaIntensidad';

type Props = NativeStackScreenProps<RutasOnboarding, 'Cierre'>;

/**
 * Paso 8: resumen, código de participante, mensaje de inicio y explicación de la semana
 * de observación. Al confirmar se guarda todo y se inicia el monitoreo; la navegación
 * pasa sola a Hoy.
 */
export function PantallaCierre({ navigation }: Props) {
  const { borrador, finalizar, finalizando, error } = useOnboarding();
  const { usuario } = useSesion();
  const { tipografia, espaciado, colores } = useTema();

  const empezar = async () => {
    await finalizar();
  };

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={8}
        titulo="Todo listo para empezar"
        subtitulo="Así queda tu acompañamiento. Todo se puede ajustar después."
      />

      <Tarjeta tono="primario">
        <Text style={tipografia.etiqueta}>Tu código de participante</Text>
        <Text style={[tipografia.numeroGrande, { color: colores.primario }]}>
          {usuario?.codigoParticipante ?? '—'}
        </Text>
        <Text style={tipografia.cuerpo}>
          Lo creamos por ti. Es la única forma en que apareces en el estudio: no lleva tu nombre, tu correo ni
          ningún dato personal. No necesitas memorizarlo, siempre estará en Ajustes.
        </Text>
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta>
        <Fila etiqueta="Redes que acompañamos" valor={borrador.redesSociales.join(', ')} />
        <Fila
          etiqueta="Tus actividades"
          valor={borrador.habitos.map(h => `${h.nombre} (${h.duracionMinutos} min)`).join(' · ')}
        />
        <Fila etiqueta="Intensidad" valor={DESCRIPCION_MODOS[borrador.modoIntensidad].titulo} />
        <Fila etiqueta="Tu porqué" valor={`"${borrador.motivacionPersonal.trim()}"`} />
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <MensajeCalido
        icono="🌱"
        titulo="La primera semana solo observamos"
        texto="Durante siete días no habrá metas: la app aprende tu ritmo real para que, después, cada meta salga de tu propio promedio y no de un número ajeno. Las pausas antes de entrar sí empiezan desde hoy."
        tono="secundario"
      />

      {error ? (
        <View style={{ marginTop: espaciado.m }}>
          <MensajeCalido icono="🍃" texto={error} tono="acento" />
        </View>
      ) : null}

      <View style={{ height: espaciado.xl }} />
      <Boton titulo="Empezar a acompañarme" onPress={empezar} cargando={finalizando} />
      <Boton titulo="Atrás" onPress={() => navigation.goBack()} variante="texto" deshabilitado={finalizando} />
      <Text style={[tipografia.pequeno, styles.pie, { marginTop: espaciado.m }]}>
        Gracias por ser parte de esto. Vamos con calma.
      </Text>
    </Pantalla>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const { tipografia } = useTema();
  return (
    <View style={styles.fila}>
      <Text style={tipografia.etiqueta}>{etiqueta}</Text>
      <Text style={tipografia.cuerpo}>{valor || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    gap: 2,
    marginBottom: 6,
  },
  pie: {
    textAlign: 'center',
  },
});
