import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import {
  ACTIVIDADES_PREDETERMINADAS,
  MAXIMO_HABITOS,
  MINIMO_HABITOS,
  iconoDeHabito,
  type ReplacementHabit,
  type TipoActividad,
} from '../../domain/entities';
import { Boton, CampoTexto, Chip, EncabezadoPantalla, MensajeCalido, Pantalla, Tarjeta } from '../components';
import { useTema } from '../theme/tema';
import { useHabitosViewModel } from '../viewmodels/useHabitosViewModel';

/** Pestaña Hábitos: actividades sustitutas con activar/desactivar, agregar y editar. */
export function PantallaHabitos() {
  const vm = useHabitosViewModel();
  const { tipografia, colores, espaciado } = useTema();
  const [editando, setEditando] = useState<ReplacementHabit | null>(null);
  const [nombre, setNombre] = useState('');
  const [duracion, setDuracion] = useState(2);
  const [tipo, setTipo] = useState<TipoActividad | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const abrirNuevo = () => {
    setEditando(null);
    setNombre('');
    setDuracion(2);
    setTipo(null);
    setMostrarFormulario(true);
  };

  const abrirEdicion = (habito: ReplacementHabit) => {
    setEditando(habito);
    setNombre(habito.nombre);
    setDuracion(habito.duracionMinutos);
    setTipo(habito.tipoActividad);
    setMostrarFormulario(true);
  };

  const guardar = async () => {
    const datos = { nombre, duracionMinutos: duracion, tipoActividad: tipo };
    const ok = editando ? await vm.editar(editando, datos) : await vm.crear(datos);
    if (ok) {
      setMostrarFormulario(false);
      setEditando(null);
      setNombre('');
      setTipo(null);
    }
  };

  const activos = vm.habitos.filter(h => h.activo);
  const inactivos = vm.habitos.filter(h => !h.activo);

  const Fila = ({ habito }: { habito: ReplacementHabit }) => (
    <Tarjeta compacta tono={habito.activo ? 'superficie' : 'suave'}>
      <View style={styles.fila}>
        <Text style={[styles.icono, !habito.activo && styles.apagado]}>
          {iconoDeHabito(habito.tipoActividad)}
        </Text>
        <View style={styles.texto}>
          <Text style={[tipografia.cuerpoFuerte, !habito.activo && styles.apagado]}>{habito.nombre}</Text>
          <Text style={tipografia.etiqueta}>{habito.duracionMinutos} minutos</Text>
        </View>
        <Switch
          value={habito.activo}
          onValueChange={valor => vm.cambiarActivo(habito, valor)}
          trackColor={{ false: colores.borde, true: colores.secundarioSuave }}
          thumbColor={habito.activo ? colores.secundario : colores.textoTenue}
          accessibilityLabel={`${habito.activo ? 'Desactivar' : 'Activar'} ${habito.nombre}`}
        />
      </View>
      <Boton titulo="Editar" onPress={() => abrirEdicion(habito)} variante="texto" ancho={false} />
    </Tarjeta>
  );

  return (
    <Pantalla>
      <EncabezadoPantalla
        titulo="Tus actividades"
        subtitulo="Pequeñas cosas de dos o tres minutos que la pausa te ofrecerá en lugar del scroll."
      />

      {vm.cargando && vm.habitos.length === 0 ? (
        <ActivityIndicator color={colores.primario} />
      ) : (
        <View style={{ gap: espaciado.m }}>
          {activos.length === 0 ? (
            <MensajeCalido
              icono="🌿"
              titulo="No tienes actividades activas"
              texto="Activa alguna de la lista o agrega una nueva para que la pausa pueda ofrecerte una alternativa."
              tono="neutro"
            />
          ) : (
            activos.map(habito => <Fila key={habito.habitId} habito={habito} />)
          )}

          {inactivos.length > 0 ? (
            <>
              <Text style={[tipografia.etiqueta, { marginTop: espaciado.s }]}>En pausa</Text>
              {inactivos.map(habito => (
                <Fila key={habito.habitId} habito={habito} />
              ))}
            </>
          ) : null}

          {vm.mensaje ? <Text style={[tipografia.pequeno, { color: colores.aviso }]}>{vm.mensaje}</Text> : null}

          {mostrarFormulario ? (
            <Tarjeta>
              <Text style={tipografia.cuerpoFuerte}>{editando ? 'Editar actividad' : 'Nueva actividad'}</Text>
              {!editando ? (
                <View style={styles.chips}>
                  {ACTIVIDADES_PREDETERMINADAS.filter(
                    a => !vm.habitos.some(h => h.nombre.toLowerCase() === a.nombre.toLowerCase()),
                  ).map(a => (
                    <Chip
                      key={a.tipoActividad}
                      etiqueta={a.nombre}
                      icono={a.icono}
                      seleccionado={tipo === a.tipoActividad}
                      onPress={() => {
                        setNombre(a.nombre);
                        setDuracion(a.duracionMinutos);
                        setTipo(a.tipoActividad);
                      }}
                    />
                  ))}
                </View>
              ) : null}
              <CampoTexto
                etiqueta="Nombre"
                value={nombre}
                onChangeText={texto => {
                  setNombre(texto);
                  // Si el usuario reescribe el nombre, deja de ser una actividad del catálogo.
                  if (!editando) {
                    const coincide = ACTIVIDADES_PREDETERMINADAS.find(a => a.nombre === texto);
                    setTipo(coincide?.tipoActividad ?? null);
                  }
                }}
                placeholder="Por ejemplo: regar las plantas"
                editable={!vm.guardando}
              />
              <View style={styles.duracion}>
                <Text style={tipografia.etiqueta}>Duración</Text>
                {[2, 3].map(minutos => (
                  <Chip
                    key={minutos}
                    etiqueta={`${minutos} min`}
                    seleccionado={duracion === minutos}
                    onPress={() => setDuracion(minutos)}
                  />
                ))}
              </View>
              <Boton titulo={editando ? 'Guardar cambios' : 'Agregar'} onPress={guardar} cargando={vm.guardando} />
              <Boton
                titulo="Cancelar"
                onPress={() => setMostrarFormulario(false)}
                variante="texto"
                deshabilitado={vm.guardando}
              />
            </Tarjeta>
          ) : (
            <Boton titulo="Agregar una actividad" onPress={abrirNuevo} variante="secundario" />
          )}

          <Text style={tipografia.pequeno}>
            Puedes tener entre {MINIMO_HABITOS} y {MAXIMO_HABITOS} activas. Las que desactives se quedan aquí por
            si quieres retomarlas.
          </Text>
        </View>
      )}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  icono: {
    fontSize: 24,
  },
  apagado: {
    opacity: 0.5,
  },
  texto: {
    flex: 1,
    gap: 2,
  },
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
});
