import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Boton, EncabezadoOnboarding, MensajeCalido, Pantalla } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useOnboarding } from '../../viewmodels/OnboardingContext';

type Props = NativeStackScreenProps<RutasOnboarding, 'Redes'>;

/** Paso 4: qué redes sociales instaladas quiere acompañar el usuario (mínimo una). */
export function PantallaRedesOnboarding({ navigation }: Props) {
  const { borrador, actualizar, redesInstaladas, cargandoRedes, cargarRedes } = useOnboarding();
  const { tipografia, espaciado, colores, radios } = useTema();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarRedes();
  }, [cargarRedes]);

  const alternar = (redSocial: string) => {
    const actuales = borrador.redesSociales;
    const nuevas = actuales.includes(redSocial)
      ? actuales.filter(r => r !== redSocial)
      : [...actuales, redSocial];
    actualizar({ redesSociales: nuevas });
    setError(null);
  };

  const continuar = () => {
    if (borrador.redesSociales.length === 0) {
      setError('Elige al menos una red para que podamos acompañarte.');
      return;
    }
    navigation.navigate('HabitosOnboarding');
  };

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={4}
        titulo="¿Qué redes quieres que acompañemos?"
        subtitulo="Estas son las que encontramos en tu teléfono. Marca las que te gustaría usar con más intención."
      />

      {cargandoRedes && redesInstaladas.length === 0 ? (
        <ActivityIndicator color={colores.primario} />
      ) : redesInstaladas.length === 0 ? (
        <MensajeCalido
          icono="🔍"
          texto="No encontramos ninguna de las redes que podemos acompañar (Instagram, TikTok, Facebook, X, YouTube, Snapchat o Threads). Instala alguna y vuelve a este paso."
          tono="neutro"
        />
      ) : (
        <View style={{ gap: espaciado.s }}>
          {redesInstaladas.map(red => {
            const seleccionada = borrador.redesSociales.includes(red.redSocial);
            return (
              <Pressable
                key={red.paquete}
                onPress={() => alternar(red.redSocial)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: seleccionada }}
                style={({ pressed }) => [
                  styles.fila,
                  {
                    backgroundColor: seleccionada ? colores.primarioSuave : colores.superficie,
                    borderColor: seleccionada ? colores.primario : colores.borde,
                    borderRadius: radios.l,
                    padding: espaciado.m,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Image source={{ uri: red.iconoUri }} style={styles.icono} />
                <View style={styles.texto}>
                  <Text style={tipografia.cuerpoFuerte}>{red.redSocial}</Text>
                  {red.nombre !== red.redSocial ? <Text style={tipografia.pequeno}>{red.nombre}</Text> : null}
                </View>
                <Text style={[styles.marca, { color: seleccionada ? colores.primario : colores.textoTenue }]}>
                  {seleccionada ? '✓' : '○'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {error ? (
        <Text style={[tipografia.pequeno, { color: colores.aviso, marginTop: espaciado.m }]}>{error}</Text>
      ) : null}

      <View style={{ height: espaciado.l }} />
      <Text style={tipografia.pequeno}>
        La primera semana solo observamos cuánto las usas, sin metas. Después, cada meta saldrá de tu propio
        promedio.
      </Text>

      <View style={{ height: espaciado.xl }} />
      <Boton titulo="Continuar" onPress={continuar} deshabilitado={redesInstaladas.length === 0} />
      <Boton titulo="Atrás" onPress={() => navigation.goBack()} variante="texto" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1.5,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  texto: {
    flex: 1,
    gap: 2,
  },
  marca: {
    fontSize: 22,
    fontWeight: '700',
  },
});
