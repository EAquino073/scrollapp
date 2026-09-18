import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { numeroSemanaDelEstudio } from '../../domain/utilidades';
import {
  Boton,
  EncabezadoPantalla,
  IndicadorProgreso,
  MensajeCalido,
  Pantalla,
  Tarjeta,
} from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useMonitoreoViewModel } from '../viewmodels/useMonitoreoViewModel';
import { useSesion } from '../viewmodels/SesionContext';

const DIA_MS = 24 * 60 * 60 * 1000;

function saludoSegunHora(): string {
  const hora = new Date().getHours();
  if (hora < 12) {
    return 'Buenos días';
  }
  if (hora < 19) {
    return 'Buenas tardes';
  }
  return 'Buenas noches';
}

/**
 * Pestaña Hoy: saludo, el porqué del usuario, uso automático del día por red y un mensaje
 * según la semana del estudio (semana 1: observación; desde la 2: metas, en la fase 4).
 */
export function PantallaHoy() {
  const { usuario } = useSesion();
  const monitoreo = useMonitoreoViewModel();
  const { tipografia, espaciado, colores } = useTema();
  const navegacion = useNavigation<NativeStackNavigationProp<RutasRaiz>>();

  const totalMinutos = monitoreo.usoHoy.reduce((suma, uso) => suma + uso.minutosEnPrimerPlano, 0);
  const totalAperturas = monitoreo.usoHoy.reduce((suma, uso) => suma + uso.aperturas, 0);

  const fechaRegistro = usuario?.fechaRegistro ?? new Date();
  const semana = numeroSemanaDelEstudio(fechaRegistro);
  const diaDeSemana = Math.min(7, Math.floor((Date.now() - fechaRegistro.getTime()) / DIA_MS) + 1);

  return (
    <Pantalla>
      <EncabezadoPantalla
        titulo={saludoSegunHora()}
        subtitulo="Esto no es un examen. Es solo una foto tranquila de tu día."
      />

      {usuario?.motivacionPersonal ? (
        <View style={{ marginBottom: espaciado.m }}>
          <MensajeCalido icono="💛" titulo="Tu porqué" texto={usuario.motivacionPersonal} tono="acento" />
        </View>
      ) : null}

      <Tarjeta>
        <Text style={tipografia.etiqueta}>Hoy en tus redes</Text>
        <View style={styles.resumen}>
          <View style={styles.dato}>
            <Text style={tipografia.numeroGrande}>{Math.round(totalMinutos)}</Text>
            <Text style={tipografia.etiqueta}>minutos</Text>
          </View>
          <View style={styles.dato}>
            <Text style={tipografia.numeroGrande}>{totalAperturas}</Text>
            <Text style={tipografia.etiqueta}>aperturas</Text>
          </View>
        </View>
        <View style={[styles.lista, { borderTopColor: colores.borde }]}>
          {monitoreo.usoHoy.map(uso => (
            <View key={uso.paquete} style={styles.fila}>
              <Text style={tipografia.cuerpo}>{uso.redSocial}</Text>
              <Text style={tipografia.etiqueta}>
                {Math.round(uso.minutosEnPrimerPlano)} min · {uso.aperturas}{' '}
                {uso.aperturas === 1 ? 'vez' : 'veces'}
              </Text>
            </View>
          ))}
          {monitoreo.usoHoy.length === 0 && (
            <Text style={tipografia.pequeno}>
              {monitoreo.estado?.permisos.accesoUso
                ? 'Todavía no hay uso registrado hoy.'
                : 'Concede el acceso a datos de uso en Ajustes para ver esta información.'}
            </Text>
          )}
        </View>
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      {semana === 1 ? (
        <MensajeCalido
          icono="🌱"
          titulo={`Semana de observación · día ${diaDeSemana} de 7`}
          texto="Esta semana no hay metas: solo conocemos tu ritmo real. Al terminarla, cada meta saldrá de tu propio promedio, no de un número ajeno."
          tono="secundario"
        />
      ) : monitoreo.metasConLimite.length > 0 ? (
        <Tarjeta tono="secundario">
          <Text style={tipografia.cuerpoFuerte}>{`Semana ${semana}: tu límite de hoy`}</Text>
          {monitoreo.metasConLimite.map(meta => {
            const uso = monitoreo.usoHoy.find(u => u.redSocial === meta.redSocial);
            const minutos = Math.round(uso?.minutosEnPrimerPlano ?? 0);
            return (
              <IndicadorProgreso
                key={meta.targetId}
                progreso={minutos / meta.limiteMinutosDiarios}
                etiqueta={meta.redSocial}
                detalle={`${minutos} de ${meta.limiteMinutosDiarios} min`}
                color={minutos <= meta.limiteMinutosDiarios ? colores.secundario : colores.acento}
              />
            );
          })}
          <Text style={tipografia.etiqueta}>
            Salió de tu propio promedio de la semana pasada, menos un 10 %. Pasarte no borra nada.
          </Text>
        </Tarjeta>
      ) : (
        <MensajeCalido
          icono="🎯"
          titulo={`Semana ${semana}`}
          texto="Tu límite aparecerá aquí en cuanto cierre la semana anterior y calculemos tu promedio."
          tono="secundario"
        />
      )}

      <View style={{ height: espaciado.m }} />

      <Boton titulo="Ver mi check-in de hoy" onPress={() => navegacion.navigate('CheckIn')} variante="secundario" />

      <View style={{ height: espaciado.m }} />

      <Tarjeta tono={monitoreo.estado?.activo ? 'secundario' : 'suave'} compacta>
        <Text style={tipografia.cuerpoFuerte}>
          {monitoreo.estado?.activo ? 'Acompañamiento activo' : 'Acompañamiento en pausa'}
        </Text>
        <Text style={tipografia.etiqueta}>
          {monitoreo.estado?.activo
            ? 'Cuando abras una red social, te haremos una pregunta breve antes de entrar. Siempre puedes continuar.'
            : 'Actívalo desde Ajustes cuando quieras que te acompañemos.'}
        </Text>
      </Tarjeta>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  resumen: {
    flexDirection: 'row',
    gap: 32,
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
  fila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
