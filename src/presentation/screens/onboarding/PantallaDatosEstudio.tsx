import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GAMAS_DISPOSITIVO, type GamaDispositivo } from '../../../domain/usecases';
import { Boton, Chip, EncabezadoOnboarding, Pantalla, Tarjeta } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useOnboarding } from '../../viewmodels/OnboardingContext';

type Props = NativeStackScreenProps<RutasOnboarding, 'DatosEstudio'>;

export const RANGOS_EDAD = ['18 a 24', '25 a 34', '35 a 44', '45 o más'];
export const GENEROS = ['Femenino', 'Masculino', 'Prefiero no indicarlo'];
const ETIQUETA_GAMA: Record<GamaDispositivo, string> = { BAJA: 'Gama baja', MEDIA: 'Gama media', ALTA: 'Gama alta' };

/** Paso 2: datos del estudio (edad, género y gama del teléfono). */
export function PantallaDatosEstudio({ navigation }: Props) {
  const { borrador, actualizar, sugerenciaGama, cargandoGama } = useOnboarding();
  const { tipografia, espaciado, colores } = useTema();
  const [errores, setErrores] = useState<{ edad?: string; genero?: string; gama?: string }>({});

  const continuar = () => {
    const nuevos: typeof errores = {};
    if (!borrador.rangoEdad) {
      nuevos.edad = 'Elige tu rango de edad.';
    }
    if (!borrador.genero) {
      nuevos.genero = 'Elige una opción.';
    }
    if (!borrador.gamaDispositivo) {
      nuevos.gama = 'Elige la gama de tu teléfono.';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) {
      navigation.navigate('Motivacion');
    }
  };

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={2}
        titulo="Unos datos para el estudio"
        subtitulo="Solo sirven para agrupar resultados. Nada de esto se muestra con tu nombre."
      />

      <View style={{ gap: espaciado.l }}>
        <View style={styles.grupo}>
          <Text style={tipografia.etiqueta}>Rango de edad</Text>
          <View style={styles.chips}>
            {RANGOS_EDAD.map(rango => (
              <Chip
                key={rango}
                etiqueta={rango}
                seleccionado={borrador.rangoEdad === rango}
                onPress={() => actualizar({ rangoEdad: rango })}
              />
            ))}
          </View>
          {errores.edad ? <Text style={[tipografia.pequeno, { color: colores.aviso }]}>{errores.edad}</Text> : null}
        </View>

        <View style={styles.grupo}>
          <Text style={tipografia.etiqueta}>Género</Text>
          <View style={styles.chips}>
            {GENEROS.map(genero => (
              <Chip
                key={genero}
                etiqueta={genero}
                seleccionado={borrador.genero === genero}
                onPress={() => actualizar({ genero })}
              />
            ))}
          </View>
          {errores.genero ? <Text style={[tipografia.pequeno, { color: colores.aviso }]}>{errores.genero}</Text> : null}
        </View>

        <View style={styles.grupo}>
          <Text style={tipografia.etiqueta}>Gama de tu teléfono</Text>
          <Tarjeta tono="suave" compacta>
            {cargandoGama ? (
              <ActivityIndicator color={colores.primario} />
            ) : sugerenciaGama ? (
              <Text style={tipografia.etiqueta}>
                Detectamos un {sugerenciaGama.fabricante} {sugerenciaGama.modelo} con {sugerenciaGama.ramGb} GB
                de RAM: parece {ETIQUETA_GAMA[sugerenciaGama.gama].toLowerCase()}. Si no coincide, corrígelo.
              </Text>
            ) : (
              <Text style={tipografia.etiqueta}>No pudimos detectarla automáticamente; elige la que creas.</Text>
            )}
          </Tarjeta>
          <View style={styles.chips}>
            {GAMAS_DISPOSITIVO.map(gama => (
              <Chip
                key={gama}
                etiqueta={ETIQUETA_GAMA[gama]}
                seleccionado={borrador.gamaDispositivo === gama}
                onPress={() => actualizar({ gamaDispositivo: gama })}
              />
            ))}
          </View>
          {errores.gama ? <Text style={[tipografia.pequeno, { color: colores.aviso }]}>{errores.gama}</Text> : null}
        </View>
      </View>

      <View style={{ height: espaciado.xl }} />
      <Boton titulo="Continuar" onPress={continuar} />
      <Boton titulo="Atrás" onPress={() => navigation.goBack()} variante="texto" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  grupo: {
    gap: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
