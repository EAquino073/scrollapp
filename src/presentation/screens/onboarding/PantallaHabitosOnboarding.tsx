import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVIDADES_PREDETERMINADAS, MAXIMO_HABITOS, MINIMO_HABITOS } from '../../../domain/entities';
import { Boton, CampoTexto, Chip, EncabezadoOnboarding, Pantalla, Tarjeta } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useOnboarding } from '../../viewmodels/OnboardingContext';

type Props = NativeStackScreenProps<RutasOnboarding, 'HabitosOnboarding'>;

/** Paso 5: entre tres y cinco micro-actividades de dos o tres minutos. */
export function PantallaHabitosOnboarding({ navigation }: Props) {
  const { borrador, actualizar } = useOnboarding();
  const { tipografia, espaciado, colores } = useTema();
  const [nombrePropio, setNombrePropio] = useState('');
  const [duracionPropia, setDuracionPropia] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const habitos = borrador.habitos;
  const tieneNombre = (nombre: string) => habitos.some(h => h.nombre.toLowerCase() === nombre.toLowerCase());

  const alternarSugerencia = (nombre: string) => {
    setError(null);
    const actividad = ACTIVIDADES_PREDETERMINADAS.find(a => a.nombre === nombre);
    if (!actividad) {
      return;
    }
    if (tieneNombre(actividad.nombre)) {
      actualizar({ habitos: habitos.filter(h => h.nombre !== actividad.nombre) });
      return;
    }
    if (habitos.length >= MAXIMO_HABITOS) {
      setError(`Con ${MAXIMO_HABITOS} es suficiente. Quita una si quieres cambiarla.`);
      return;
    }
    actualizar({
      habitos: [
        ...habitos,
        {
          nombre: actividad.nombre,
          duracionMinutos: actividad.duracionMinutos,
          tipoActividad: actividad.tipoActividad,
        },
      ],
    });
  };

  const agregarPropio = () => {
    const nombre = nombrePropio.trim();
    if (nombre.length < 3) {
      setError('Ponle un nombre corto a tu actividad.');
      return;
    }
    if (tieneNombre(nombre)) {
      setError('Esa actividad ya está en tu lista.');
      return;
    }
    if (habitos.length >= MAXIMO_HABITOS) {
      setError(`Con ${MAXIMO_HABITOS} es suficiente. Quita una si quieres cambiarla.`);
      return;
    }
    actualizar({
      habitos: [...habitos, { nombre, duracionMinutos: duracionPropia, tipoActividad: null }],
    });
    setNombrePropio('');
    setError(null);
  };

  const quitar = (nombre: string) => actualizar({ habitos: habitos.filter(h => h.nombre !== nombre) });

  const continuar = () => {
    if (habitos.length < MINIMO_HABITOS) {
      setError(`Elige al menos ${MINIMO_HABITOS} actividades para tener de dónde escoger.`);
      return;
    }
    navigation.navigate('Intensidad');
  };

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={5}
        titulo="Tus actividades"
        subtitulo={`Cuando sientas el impulso de abrir una red, te ofreceremos una de estas. Elige entre ${MINIMO_HABITOS} y ${MAXIMO_HABITOS}.`}
      />

      <Text style={tipografia.etiqueta}>Sugerencias</Text>
      <View style={[styles.chips, { marginTop: espaciado.s }]}>
        {ACTIVIDADES_PREDETERMINADAS.map(actividad => (
          <Chip
            key={actividad.tipoActividad}
            etiqueta={`${actividad.nombre} · ${actividad.duracionMinutos} min`}
            icono={actividad.icono}
            seleccionado={tieneNombre(actividad.nombre)}
            onPress={() => alternarSugerencia(actividad.nombre)}
          />
        ))}
      </View>

      <View style={{ height: espaciado.l }} />

      <Tarjeta compacta>
        <Text style={tipografia.cuerpoFuerte}>Agregar una propia</Text>
        <CampoTexto
          etiqueta="Nombre"
          value={nombrePropio}
          onChangeText={setNombrePropio}
          placeholder="Por ejemplo: regar las plantas"
          onSubmitEditing={agregarPropio}
        />
        <View style={styles.duracion}>
          <Text style={tipografia.etiqueta}>Duración</Text>
          {[2, 3].map(minutos => (
            <Chip
              key={minutos}
              etiqueta={`${minutos} min`}
              seleccionado={duracionPropia === minutos}
              onPress={() => setDuracionPropia(minutos)}
            />
          ))}
        </View>
        <Boton titulo="Agregar" onPress={agregarPropio} variante="secundario" />
      </Tarjeta>

      <View style={{ height: espaciado.l }} />

      <Text style={tipografia.etiqueta}>
        Tu lista ({habitos.length} de {MAXIMO_HABITOS})
      </Text>
      <View style={{ gap: espaciado.s, marginTop: espaciado.s }}>
        {habitos.length === 0 ? (
          <Text style={tipografia.pequeno}>Todavía no has elegido ninguna.</Text>
        ) : (
          habitos.map(habito => (
            <View key={habito.nombre} style={[styles.filaHabito, { borderColor: colores.borde }]}>
              <Text style={[tipografia.cuerpo, styles.texto]}>
                {habito.nombre} · {habito.duracionMinutos} min
              </Text>
              <Boton titulo="Quitar" onPress={() => quitar(habito.nombre)} variante="texto" ancho={false} />
            </View>
          ))
        )}
      </View>

      {error ? (
        <Text style={[tipografia.pequeno, { color: colores.aviso, marginTop: espaciado.m }]}>{error}</Text>
      ) : null}

      <View style={{ height: espaciado.xl }} />
      <Boton titulo="Continuar" onPress={continuar} />
      <Boton titulo="Atrás" onPress={() => navigation.goBack()} variante="texto" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  duracion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filaHabito: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 4,
  },
  texto: {
    flex: 1,
  },
});
