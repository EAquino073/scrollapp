import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Boton, CampoTexto, EncabezadoOnboarding, MensajeCalido, Pantalla } from '../../components';
import type { RutasOnboarding } from '../../navigation/rutas';
import { useTema } from '../../theme/tema';
import { useOnboarding } from '../../viewmodels/OnboardingContext';

type Props = NativeStackScreenProps<RutasOnboarding, 'Motivacion'>;

/** Ejemplos que rotan como placeholder; no son opciones fijas. */
const EJEMPLOS = [
  'Quiero dormirme sin el teléfono en la mano y despertar con más energía.',
  'Quiero estar presente cuando estoy con mis hijos, sin mirar la pantalla.',
  'Quiero terminar mi tesis y sentir que mi tiempo es mío.',
  'Quiero leer más y sentir menos ansiedad al final del día.',
];

const MINIMO = 10;

/** Paso 3: el "por qué" personal que acompañará el progreso y la pausa de fricción. */
export function PantallaMotivacion({ navigation }: Props) {
  const { borrador, actualizar } = useOnboarding();
  const { espaciado, tipografia } = useTema();
  const [indice, setIndice] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rotar = setInterval(() => setIndice(previo => (previo + 1) % EJEMPLOS.length), 4000);
    return () => clearInterval(rotar);
  }, []);

  const continuar = () => {
    if (borrador.motivacionPersonal.trim().length < MINIMO) {
      setError('Cuéntanos un poco más; una frase corta basta.');
      return;
    }
    setError(null);
    navigation.navigate('Redes');
  };

  return (
    <Pantalla>
      <EncabezadoOnboarding
        paso={3}
        titulo="¿Para qué quieres esto?"
        subtitulo="Escribe con tus palabras qué te gustaría recuperar. No hay respuesta pequeña."
      />

      <View style={{ gap: espaciado.m }}>
        <MensajeCalido
          icono="💛"
          texto="Este texto aparecerá en tu progreso y, a veces, en la pausa antes de abrir una red social. Es tu recordatorio, escrito por ti."
          tono="acento"
        />
        <CampoTexto
          etiqueta="Mi porqué"
          value={borrador.motivacionPersonal}
          onChangeText={texto => actualizar({ motivacionPersonal: texto })}
          placeholder={EJEMPLOS[indice]}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          style={styles.campo}
          error={error}
          ayuda="Los ejemplos que ves son solo inspiración; escribe el tuyo."
        />
        <Text style={tipografia.pequeno}>Puedes cambiarlo más adelante desde Ajustes.</Text>
      </View>

      <View style={{ height: espaciado.xl }} />
      <Boton titulo="Continuar" onPress={continuar} />
      <Boton titulo="Atrás" onPress={() => navigation.goBack()} variante="texto" />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  campo: {
    minHeight: 120,
    paddingTop: 12,
  },
});
