import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { contenedor } from '../../di/container';
import { MODOS_INTENSIDAD, type ModoIntensidad } from '../../domain/entities';
import { HORAS_CHECKIN, formatearHora } from '../../domain/usecases';
import { numeroSemanaDelEstudio } from '../../domain/utilidades';
import { Boton, Chip, EncabezadoPantalla, MensajeCalido, Pantalla, Tarjeta } from '../components';
import type { RutasRaiz } from '../navigation/rutas';
import { useTema } from '../theme/tema';
import { useAjustesViewModel } from '../viewmodels/useAjustesViewModel';
import { useMonitoreoViewModel } from '../viewmodels/useMonitoreoViewModel';
import { useSesion } from '../viewmodels/SesionContext';
import { DESCRIPCION_MODOS } from './onboarding/PantallaIntensidad';

const ETIQUETA_MODO: Record<ModoIntensidad, string> = {
  SUAVE: 'Suave',
  MEDIO: 'Medio',
  FUERTE: 'Fuerte',
};

interface FilaPermisoProps {
  titulo: string;
  descripcion: string;
  concedido: boolean;
  accion: () => void;
}

function FilaPermiso({ titulo, descripcion, concedido, accion }: FilaPermisoProps) {
  const { tipografia, colores } = useTema();
  return (
    <View style={styles.filaPermiso}>
      <View style={styles.textoPermiso}>
        <Text style={tipografia.cuerpoFuerte}>
          {concedido ? '✓ ' : ''}
          {titulo}
        </Text>
        <Text style={tipografia.etiqueta}>{descripcion}</Text>
      </View>
      {concedido ? (
        <Text style={[tipografia.pequeno, { color: colores.secundario }]}>Listo</Text>
      ) : (
        <Boton titulo="Conceder" onPress={accion} variante="secundario" ancho={false} />
      )}
    </View>
  );
}

/** Pestaña Ajustes: intensidad, redes acompañadas, permisos, tu porqué y sesión. */
export function PantallaAjustes() {
  const sesion = useSesion();
  const ajustes = useAjustesViewModel();
  const monitoreo = useMonitoreoViewModel();
  const { tipografia, espaciado, colores, radios } = useTema();
  const navegacion = useNavigation<NativeStackNavigationProp<RutasRaiz>>();
  const permisos = monitoreo.estado?.permisos;
  const semanaActual = sesion.usuario ? numeroSemanaDelEstudio(sesion.usuario.fechaRegistro) : 1;
  const encuestaDisponible = sesion.usuario
    ? contenedor.casosDeUso.guardarRespuestaEncuesta.estaDisponible(sesion.usuario)
    : false;

  return (
    <Pantalla>
      <EncabezadoPantalla
        titulo="Ajustes"
        subtitulo="Tú decides cuánto te acompañamos. Puedes cambiarlo cuando quieras."
      />

      <Tarjeta>
        <Text style={tipografia.cuerpoFuerte}>Intensidad del acompañamiento</Text>
        <View style={styles.chips}>
          {MODOS_INTENSIDAD.map(modo => (
            <Chip
              key={modo}
              etiqueta={ETIQUETA_MODO[modo]}
              seleccionado={ajustes.modo === modo}
              onPress={() => ajustes.cambiarModo(modo)}
              deshabilitado={ajustes.guardando}
            />
          ))}
        </View>
        {ajustes.modo ? <Text style={tipografia.etiqueta}>{DESCRIPCION_MODOS[ajustes.modo].texto}</Text> : null}
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta>
        <Text style={tipografia.cuerpoFuerte}>Redes que acompañamos</Text>
        <Text style={tipografia.etiqueta}>Solo aparecen las que están instaladas en tu teléfono.</Text>
        {ajustes.cargandoRedes ? (
          <ActivityIndicator color={colores.primario} />
        ) : (
          <View style={{ gap: espaciado.s }}>
            {ajustes.redesInstaladas.map(red => {
              const seleccionada = ajustes.redesSeleccionadas.includes(red.redSocial);
              return (
                <Pressable
                  key={red.paquete}
                  onPress={() => ajustes.alternarRed(red.redSocial)}
                  disabled={ajustes.guardando}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: seleccionada }}
                  style={({ pressed }) => [
                    styles.filaRed,
                    {
                      backgroundColor: seleccionada ? colores.primarioSuave : colores.superficieSuave,
                      borderColor: seleccionada ? colores.primario : colores.borde,
                      borderRadius: radios.m,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Image source={{ uri: red.iconoUri }} style={styles.iconoRed} />
                  <Text style={[tipografia.cuerpo, styles.nombreRed]}>{red.redSocial}</Text>
                  <Text style={[styles.marca, { color: seleccionada ? colores.primario : colores.textoTenue }]}>
                    {seleccionada ? '✓' : '○'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        {ajustes.hayCambiosRedes ? (
          <Boton titulo="Guardar redes" onPress={ajustes.guardarRedes} cargando={ajustes.guardando} />
        ) : null}
        {ajustes.mensaje ? <Text style={tipografia.pequeno}>{ajustes.mensaje}</Text> : null}
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta>
        <Text style={tipografia.cuerpoFuerte}>Permisos para acompañarte</Text>
        <Text style={tipografia.etiqueta}>
          Android los pide en sus propios Ajustes. Vuelve a la app cuando termines.
        </Text>
        <FilaPermiso
          titulo="Acceso a datos de uso"
          descripcion="Para saber cuánto tiempo pasas en cada red y cuándo la abres."
          concedido={permisos?.accesoUso ?? false}
          accion={monitoreo.abrirPermisoUso}
        />
        <FilaPermiso
          titulo="Mostrar sobre otras apps"
          descripcion="Para que la pausa aparezca encima de la red social."
          concedido={permisos?.superposicion ?? false}
          accion={monitoreo.abrirSuperposicion}
        />
        <FilaPermiso
          titulo="Sin optimización de batería"
          descripcion="Para que el sistema no detenga el acompañamiento en segundo plano."
          concedido={permisos?.exentoBateria ?? false}
          accion={monitoreo.solicitarBateria}
        />
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta tono={monitoreo.estado?.activo ? 'secundario' : 'suave'}>
        <Text style={tipografia.cuerpoFuerte}>
          {monitoreo.estado?.activo ? 'Acompañamiento activo' : 'Acompañamiento en pausa'}
        </Text>
        {monitoreo.mensaje ? <MensajeCalido texto={monitoreo.mensaje} icono="🍃" tono="acento" /> : null}
        {monitoreo.estado?.activo ? (
          <Boton titulo="Pausar acompañamiento" onPress={monitoreo.detener} variante="secundario" />
        ) : (
          <Boton
            titulo="Activar acompañamiento"
            onPress={monitoreo.iniciar}
            deshabilitado={!monitoreo.estado?.listoParaIniciar || monitoreo.redes.length === 0}
          />
        )}
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta>
        <View style={styles.filaTitulo}>
          <View style={styles.textoPermiso}>
            <Text style={tipografia.cuerpoFuerte}>Check-in de la noche</Text>
            <Text style={tipografia.etiqueta}>
              Un aviso al día para mirar tu jornada con calma. Nada más; no hay más notificaciones.
            </Text>
          </View>
          <Switch
            value={ajustes.checkInActivo}
            onValueChange={ajustes.alternarCheckIn}
            trackColor={{ false: colores.borde, true: colores.secundarioSuave }}
            thumbColor={ajustes.checkInActivo ? colores.secundario : colores.textoTenue}
            accessibilityLabel="Activar el recordatorio del check-in"
          />
        </View>
        {ajustes.checkInActivo ? (
          <>
            <Text style={tipografia.etiqueta}>¿A qué hora te viene bien?</Text>
            <View style={styles.chips}>
              {HORAS_CHECKIN.map(hora => (
                <Chip
                  key={formatearHora(hora)}
                  etiqueta={formatearHora(hora)}
                  seleccionado={
                    ajustes.horaCheckIn.hora === hora.hora && ajustes.horaCheckIn.minuto === hora.minuto
                  }
                  onPress={() => ajustes.cambiarHoraCheckIn(hora)}
                />
              ))}
            </View>
          </>
        ) : null}
        <Boton titulo="Abrir mi check-in ahora" onPress={() => navegacion.navigate('CheckIn')} variante="secundario" />
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta>
        <Text style={tipografia.cuerpoFuerte}>Tu estudio</Text>
        <Text style={tipografia.etiqueta}>
          Vas por la semana {semanaActual} de 6. Aquí puedes revisar tu avance cuando quieras.
        </Text>
        <Boton
          titulo="Ver mi revisión semanal"
          onPress={() => navegacion.navigate('RevisionSemanal', {})}
          variante="secundario"
        />
        <Boton
          titulo={encuestaDisponible ? 'Responder la encuesta final' : 'Abrir la encuesta final (pruebas)'}
          onPress={() => navegacion.navigate('Encuesta')}
          variante="texto"
        />
        {!encuestaDisponible ? (
          <Text style={tipografia.pequeno}>
            La encuesta se habilita sola al terminar la semana 6. El acceso de arriba es para pruebas.
          </Text>
        ) : null}
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta tono="acento" compacta>
        <Text style={tipografia.etiqueta}>Tu porqué</Text>
        <Text style={tipografia.cuerpo}>
          {sesion.usuario?.motivacionPersonal ? `"${sesion.usuario.motivacionPersonal}"` : 'Aún no lo escribiste.'}
        </Text>
      </Tarjeta>

      <View style={{ height: espaciado.m }} />

      <Tarjeta tono="suave" compacta>
        <Text style={tipografia.etiqueta}>Tu código de participante</Text>
        <Text style={[tipografia.tituloMediano, { color: colores.primario }]}>
          {sesion.usuario?.codigoParticipante || '—'}
        </Text>
        <Text style={tipografia.pequeno}>
          Lo creamos por ti al abrir tu cuenta. Es la única forma en que apareces en el estudio: no lleva tu
          nombre, tu correo ni ningún dato personal.
        </Text>
      </Tarjeta>

      <View style={{ height: espaciado.l }} />

      <Boton titulo="Cerrar sesión" onPress={sesion.cerrarSesion} variante="texto" cargando={sesion.procesando} />
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  filaPermiso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
  },
  filaTitulo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  textoPermiso: {
    flex: 1,
    gap: 2,
  },
  filaRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1.5,
    padding: 10,
  },
  iconoRed: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  nombreRed: {
    flex: 1,
  },
  marca: {
    fontSize: 20,
    fontWeight: '700',
  },
});
