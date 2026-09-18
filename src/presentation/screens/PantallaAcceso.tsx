import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Boton, CampoTexto, EncabezadoPantalla, MensajeCalido, Pantalla, Tarjeta } from '../components';
import { useTema } from '../theme/tema';
import { useSesion } from '../viewmodels/SesionContext';

type Modo = 'acceso' | 'registro';

/**
 * Acceso y registro con correo y contraseña (único método de autenticación).
 * Textos cálidos: la app acompaña, no evalúa.
 */
export function PantallaAcceso() {
  const sesion = useSesion();
  const { tipografia, espaciado } = useTema();
  const [modo, setModo] = useState<Modo>('registro');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<{ correo?: string; contrasena?: string; confirmacion?: string }>({});

  const esRegistro = modo === 'registro';

  const cambiarModo = () => {
    setModo(esRegistro ? 'acceso' : 'registro');
    setErrores({});
    sesion.limpiarError();
  };

  const validar = () => {
    const nuevos: typeof errores = {};
    if (!correo.trim()) {
      nuevos.correo = 'Escribe tu correo para continuar.';
    } else if (!/^\S+@\S+\.\S+$/.test(correo.trim())) {
      nuevos.correo = 'Ese correo no parece completo. Revísalo con calma.';
    }
    if (contrasena.length < 6) {
      nuevos.contrasena = 'La contraseña necesita al menos 6 caracteres.';
    }
    if (esRegistro && contrasena !== confirmacion) {
      nuevos.confirmacion = 'Las contraseñas no coinciden. Revísalas con calma.';
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const enviar = async () => {
    if (!validar()) {
      return;
    }
    if (esRegistro) {
      await sesion.registrar(correo, contrasena);
    } else {
      await sesion.iniciarSesion(correo, contrasena);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pantalla>
        <EncabezadoPantalla
          titulo={esRegistro ? 'Qué bueno tenerte aquí' : 'Hola de nuevo'}
          subtitulo={
            esRegistro
              ? 'Crea tu cuenta para empezar. Solo usaremos tu correo para que puedas volver a entrar; tu participación en el estudio es anónima.'
              : 'Entra con tu correo y contraseña para retomar donde lo dejaste.'
          }
        />

        <Tarjeta>
          <View style={{ gap: espaciado.m }}>
            <CampoTexto
              etiqueta="Correo"
              value={correo}
              onChangeText={setCorreo}
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              editable={!sesion.procesando}
              error={errores.correo}
            />
            <CampoTexto
              etiqueta="Contraseña"
              value={contrasena}
              onChangeText={setContrasena}
              placeholder="Al menos 6 caracteres"
              secureTextEntry
              autoCapitalize="none"
              autoComplete={esRegistro ? 'new-password' : 'password'}
              editable={!sesion.procesando}
              error={errores.contrasena}
              onSubmitEditing={esRegistro ? undefined : enviar}
            />
            {esRegistro && (
              <CampoTexto
                etiqueta="Confirma tu contraseña"
                value={confirmacion}
                onChangeText={setConfirmacion}
                placeholder="Repite la contraseña"
                secureTextEntry
                autoCapitalize="none"
                editable={!sesion.procesando}
                error={errores.confirmacion}
                onSubmitEditing={enviar}
              />
            )}

            {sesion.error ? <MensajeCalido texto={sesion.error} icono="🍃" tono="acento" /> : null}

            <Boton
              titulo={esRegistro ? 'Crear mi cuenta' : 'Entrar'}
              onPress={enviar}
              cargando={sesion.procesando}
              estilo={{ marginTop: espaciado.s }}
            />
            <Boton
              titulo={esRegistro ? '¿Ya tienes cuenta? Entra aquí' : '¿Es tu primera vez? Crea tu cuenta'}
              onPress={cambiarModo}
              variante="texto"
              deshabilitado={sesion.procesando}
            />
          </View>
        </Tarjeta>

        <Text style={[tipografia.pequeno, styles.pie, { marginTop: espaciado.l }]}>
          ScrollApp nunca bloquea nada. Solo te acompaña a decidir con calma.
        </Text>
      </Pantalla>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pie: { textAlign: 'center' },
});
