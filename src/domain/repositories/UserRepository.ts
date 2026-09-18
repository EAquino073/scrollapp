import type { ModoIntensidad, Usuario } from '../entities';

/** Acceso al documento del participante en la colección `usuarios`. */
export interface UserRepository {
  /** Devuelve el usuario o `null` si aún no existe su documento. */
  obtenerUsuario(uid: string): Promise<Usuario | null>;
  /** Crea o reemplaza el documento `usuarios/{uid}`. */
  guardarUsuario(usuario: Usuario): Promise<void>;
  actualizarModoIntensidad(uid: string, modo: ModoIntensidad): Promise<void>;
  /** Actualiza solo los campos indicados del documento (extensión del diagrama). */
  actualizarCampos(uid: string, cambios: Partial<Omit<Usuario, 'uid'>>): Promise<void>;
  /**
   * `true`/`false` si se pudo comprobar que el código ya está en uso;
   * `null` si las reglas de seguridad no permiten consultar la colección completa
   * (cada participante solo puede leer su propio documento).
   */
  existeCodigoParticipante(codigo: string): Promise<boolean | null>;
}
