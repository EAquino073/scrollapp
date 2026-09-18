/**
 * Sesión de Firebase Auth (correo y contraseña).
 * No aparece en el diagrama de clases porque la autenticación es
 * infraestructura, pero el caso de uso "Registrarse en la app (Firebase Auth)"
 * la requiere. Solo expone el uid: el correo nunca llega a Firestore.
 */
export interface SesionAuth {
  uid: string;
}

export interface AuthRepository {
  registrar(correo: string, contrasena: string): Promise<SesionAuth>;
  iniciarSesion(correo: string, contrasena: string): Promise<SesionAuth>;
  cerrarSesion(): Promise<void>;
  /** Sesión actual o `null` si nadie ha iniciado sesión. */
  sesionActual(): SesionAuth | null;
  /** Se suscribe a cambios de sesión. Devuelve la función para cancelar. */
  observarSesion(callback: (sesion: SesionAuth | null) => void): () => void;
}
