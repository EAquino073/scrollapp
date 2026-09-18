/**
 * Traduce los códigos de error de Firebase Auth a mensajes cálidos en español.
 * Nunca se muestra al usuario el mensaje técnico original.
 */
const MENSAJES: Record<string, string> = {
  'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. ¿Quieres iniciar sesión?',
  'auth/invalid-email': 'Ese correo no parece válido. Revísalo con calma.',
  'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
  'auth/user-not-found': 'No encontramos una cuenta con ese correo.',
  'auth/wrong-password': 'La contraseña no coincide. Inténtalo de nuevo.',
  'auth/invalid-credential': 'El correo o la contraseña no coinciden. Inténtalo de nuevo.',
  'auth/too-many-requests': 'Hubo muchos intentos seguidos. Espera un momento y vuelve a probar.',
  'auth/network-request-failed': 'No hay conexión en este momento. Inténtalo cuando tengas internet.',
  'auth/user-disabled': 'Esta cuenta está desactivada. Escribe al equipo del estudio.',
};

const MENSAJE_GENERICO = 'Algo no salió bien. Inténtalo de nuevo en un momento.';

export function mensajeDeErrorAuth(error: unknown): string {
  const codigo = (error as { code?: string } | null)?.code;
  if (codigo && MENSAJES[codigo]) {
    return MENSAJES[codigo];
  }
  return MENSAJE_GENERICO;
}
