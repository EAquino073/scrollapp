import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { ESTADOS_ANIMO } from '../../domain/usecases';
import {
  Boton,
  CampoTexto,
  Chip,
  EncabezadoPantalla,
  IndicadorProgreso,
  MensajeCalido,
  Pantalla,
  Tarjeta,
} from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useCheckInViewModel } from '../viewmodels/useCheckInViewModel';

type Props = NativeStackScreenProps<RutasRaiz, 'CheckIn'>;

/**
 * Check-in nocturno: resumen del día por red, decisiones de fricción, estado respecto al
 * límite y reflexión diaria opcional. Al abrirse se escribe el `ScrollLog` del día.
 */
export function PantallaCheckIn({ navigation }: Props) {
  const vm = useCheckInViewModel();
  const { tipografia, colores, espaciado } = useTema();
  const resumen = vm.resumen;

  if (vm.cargando && !resumen) {
    return (
      <Pantalla centrado>
        <ActivityIndicator size="large" color={colores.primario} />
        <Text style={[tipografia.etiqueta, styles.centrado, { marginTop: espaciado.m }]}>
          Preparando tu resumen…
        </Text>
      </Pantalla>
    );
  }

  return (
    <Pantalla>
      <EncabezadoPantalla
        titulo="¿Cómo te fue hoy?"
        subtitulo="Un momento tranquilo para mirar el día. Nada de esto es una calificación."
      />

      {resumen ? (
        <>
          <MensajeCalido
            icono={resumen.mensaje.icono}
            titulo={resumen.mensaje.titulo}
            texto={resumen.mensaje.texto}
            tono="secundario"
          />

          <View style={{ height: espaciado.m }} />

          <Tarjeta>
            <Text style={tipografia.etiqueta}>Tu día en números</Text>
            <View style={styles.resumen}>
              <View style={styles.dato}>
                <Text style={tipografia.numeroGrande}>{resumen.minutosTotales}</Text>
                <Text style={tipografia.etiqueta}>minutos</Text>
              </View>
              <View style={styles.dato}>
                <Text style={tipografia.numeroGrande}>{resumen.aperturasTotales}</Text>
                <Text style={tipografia.etiqueta}>aperturas</Text>
              </View>
              <View style={styles.dato}>
                <Text style={tipografia.numeroGrande}>{resumen.sustituciones}</Text>
                <Text style={tipografia.etiqueta}>
                  {resumen.sustituciones === 1 ? 'sustitución' : 'sustituciones'}
                </Text>
              </View>
            </View>

            <View style={[styles.lista, { borderTopColor: colores.borde }]}>
              {resumen.porRed.length === 0 ? (
                <Text style={tipografia.pequeno}>Hoy no registramos uso en tus redes.</Text>
              ) : (
                resumen.porRed.map(red => (
                  <View key={red.redSocial} style={styles.filaRed}>
                    <View style={styles.textoRed}>
                      <Text style={tipografia.cuerpo}>{red.redSocial}</Text>
                      <Text style={tipografia.etiqueta}>
                        {red.minutosUsados} min · {red.aperturas}{' '}
                        {red.aperturas === 1 ? 'vez' : 'veces'}
                        {red.limiteMinutos > 0 ? ` · tu límite: ${red.limiteMinutos} min` : ''}
                      </Text>
                    </View>
                    {red.limiteMinutos > 0 ? (
                      <Text
                        style={[
                          tipografia.pequeno,
                          { color: red.cumplioLimite ? colores.secundario : colores.textoSuave },
                        ]}
                      >
                        {red.cumplioLimite ? 'dentro' : 'por encima'}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}
            </View>

            {resumen.limiteTotal > 0 ? (
              <View style={{ marginTop: espaciado.s }}>
                <IndicadorProgreso
                  progreso={resumen.minutosTotales / resumen.limiteTotal}
                  etiqueta="Respecto a tu límite de hoy"
                  detalle={`${resumen.minutosTotales} de ${resumen.limiteTotal} min`}
                  color={resumen.cumplioTodosLosLimites ? colores.secundario : colores.acento}
                />
              </View>
            ) : (
              <Text style={tipografia.pequeno}>
                Semana {resumen.numeroSemana}: seguimos observando, todavía sin límites.
              </Text>
            )}
          </Tarjeta>

          <View style={{ height: espaciado.m }} />

          <Tarjeta>
            <Text style={tipografia.cuerpoFuerte}>Tu reflexión de hoy (opcional)</Text>
            <Text style={tipografia.etiqueta}>
              Si te apetece, deja una nota. Nadie más la lee y puedes saltarla sin problema.
            </Text>

            <View style={styles.chips}>
              {ESTADOS_ANIMO.map(estado => (
                <Chip
                  key={estado.valor}
                  etiqueta={estado.etiqueta}
                  icono={estado.icono}
                  seleccionado={vm.estadoAnimo === estado.valor}
                  onPress={() => vm.setEstadoAnimo(estado.valor)}
                  deshabilitado={vm.guardando}
                />
              ))}
            </View>

            <CampoTexto
              etiqueta="¿Algo que quieras dejar escrito?"
              value={vm.contenido}
              onChangeText={vm.setContenido}
              placeholder="Lo que sea: cómo estuvo el día, qué notaste…"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={styles.campo}
              editable={!vm.guardando}
            />

            {vm.error ? <Text style={[tipografia.pequeno, { color: colores.aviso }]}>{vm.error}</Text> : null}
            {vm.reflexionGuardada ? (
              <Text style={[tipografia.pequeno, { color: colores.secundario }]}>
                Guardada. Gracias por dejarla.
              </Text>
            ) : null}

            <Boton titulo="Guardar reflexión" onPress={vm.guardarReflexion} cargando={vm.guardando} />
          </Tarjeta>
        </>
      ) : (
        <MensajeCalido
          icono="🍃"
          texto={vm.error ?? 'No pudimos preparar tu resumen ahora mismo.'}
          tono="acento"
        />
      )}

      <View style={{ height: espaciado.l }} />
      <Boton
        titulo="Listo por hoy"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Principal' }] })}
        variante="secundario"
      />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  centrado: { textAlign: 'center' },
  resumen: {
    flexDirection: 'row',
    gap: 28,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  textoRed: {
    flex: 1,
    gap: 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  campo: {
    minHeight: 90,
    paddingTop: 12,
  },
});
