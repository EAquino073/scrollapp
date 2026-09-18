import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ESCALA_LIKERT, PREGUNTAS_ABIERTAS, SECCIONES_ENCUESTA } from '../../data/contenido';
import {
  Boton,
  CampoTexto,
  EncabezadoPantalla,
  IndicadorProgreso,
  MensajeCalido,
  Pantalla,
  Tarjeta,
} from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { claveItem, useEncuestaViewModel } from '../viewmodels/useEncuestaViewModel';

type Props = NativeStackScreenProps<RutasRaiz, 'Encuesta'>;

interface FilaProps {
  afirmacion: string;
  clave: string;
  valor: number | undefined;
  onResponder(valor: number): void;
}

function FilaAfirmacion({ afirmacion, clave, valor, onResponder }: FilaProps) {
  const { tipografia, colores, radios } = useTema();
  return (
    <View style={styles.item}>
      <Text style={tipografia.cuerpo}>{afirmacion}</Text>
      <View style={styles.escala}>
        {ESCALA_LIKERT.map(opcion => {
          const elegido = valor === opcion.valor;
          return (
            <Pressable
              key={`${clave}-${opcion.valor}`}
              onPress={() => onResponder(opcion.valor)}
              accessibilityRole="radio"
              accessibilityState={{ selected: elegido }}
              accessibilityLabel={`${opcion.valor}: ${opcion.etiqueta}`}
              style={({ pressed }) => [
                styles.opcion,
                {
                  backgroundColor: elegido ? colores.primario : colores.superficieSuave,
                  borderColor: elegido ? colores.primario : colores.borde,
                  borderRadius: radios.m,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.numero,
                  { color: elegido ? colores.sobrePrimario : colores.textoSuave },
                ]}
              >
                {opcion.valor}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

/**
 * Encuesta final del estudio: secciones B, C, D y E en escala de 1 a 5, más dos preguntas
 * abiertas. Se guarda en `respuestasEncuesta` con el promedio por sección.
 */
export function PantallaEncuesta({ navigation }: Props) {
  const vm = useEncuestaViewModel();
  const { tipografia, colores, espaciado } = useTema();

  const enviar = async () => {
    const ok = await vm.enviar();
    if (ok) {
      navigation.reset({ index: 0, routes: [{ name: 'Principal' }] });
    }
  };

  return (
    <Pantalla>
      <EncabezadoPantalla
        titulo="Tu opinión cierra el estudio"
        subtitulo="No hay respuestas correctas. Contesta con lo que sentiste de verdad; es anónimo y solo se guarda con tu código."
      />

      <IndicadorProgreso
        progreso={vm.respondidos / vm.totalItems}
        etiqueta="Tu avance"
        detalle={`${vm.respondidos} de ${vm.totalItems}`}
      />

      <View style={{ height: espaciado.s }} />
      <Text style={tipografia.pequeno}>
        1 = totalmente en desacuerdo · 5 = totalmente de acuerdo
      </Text>

      {vm.respuestaPrevia ? (
        <View style={{ marginTop: espaciado.m }}>
          <MensajeCalido
            icono="🌿"
            texto="Ya habías respondido antes. Si la contestas de nuevo, reemplazaremos tus respuestas anteriores."
            tono="neutro"
          />
        </View>
      ) : null}

      {SECCIONES_ENCUESTA.map(seccion => (
        <View key={seccion.clave} style={{ marginTop: espaciado.l }}>
          <Tarjeta>
            <Text style={tipografia.cuerpoFuerte}>{seccion.titulo}</Text>
            <Text style={tipografia.etiqueta}>{seccion.descripcion}</Text>
            {seccion.afirmaciones.map((afirmacion, indice) => (
              <FilaAfirmacion
                key={claveItem(seccion.clave, indice)}
                afirmacion={afirmacion}
                clave={claveItem(seccion.clave, indice)}
                valor={vm.respuestas[claveItem(seccion.clave, indice)]}
                onResponder={valor => vm.responder(claveItem(seccion.clave, indice), valor)}
              />
            ))}
          </Tarjeta>
        </View>
      ))}

      <View style={{ marginTop: espaciado.l }}>
        <Tarjeta>
          <Text style={tipografia.cuerpoFuerte}>Para terminar, con tus palabras</Text>
          <CampoTexto
            etiqueta={PREGUNTAS_ABIERTAS[0]}
            value={vm.abierta1}
            onChangeText={vm.setAbierta1}
            placeholder="Lo que más te sirvió…"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.campo}
            editable={!vm.guardando}
          />
          <CampoTexto
            etiqueta={PREGUNTAS_ABIERTAS[1]}
            value={vm.abierta2}
            onChangeText={vm.setAbierta2}
            placeholder="Lo que cambiarías…"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={styles.campo}
            editable={!vm.guardando}
          />
        </Tarjeta>
      </View>

      {vm.error ? (
        <Text style={[tipografia.pequeno, { color: colores.aviso, marginTop: espaciado.m }]}>{vm.error}</Text>
      ) : null}
      {vm.guardada ? (
        <Text style={[tipografia.pequeno, { color: colores.secundario, marginTop: espaciado.m }]}>
          Guardada. Gracias por acompañarnos hasta aquí.
        </Text>
      ) : null}

      <View style={{ height: espaciado.l }} />
      <Boton titulo="Enviar mis respuestas" onPress={enviar} cargando={vm.guardando} />
      <Boton titulo="Ahora no" onPress={() => navigation.goBack()} variante="texto" deshabilitado={vm.guardando} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  item: {
    gap: 8,
    marginTop: 14,
  },
  escala: {
    flexDirection: 'row',
    gap: 8,
  },
  opcion: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1.5,
    minHeight: 44,
  },
  numero: {
    fontSize: 16,
    fontWeight: '700',
  },
  campo: {
    minHeight: 90,
    paddingTop: 12,
  },
});
