import type { Usuario } from '../entities';
import type { AuthRepository, UserRepository } from '../repositories';

/** Inicia sesión con correo y contraseña y devuelve el documento del participante. */
export class IniciarSesion {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async ejecutar(correo: string, contrasena: string): Promise<Usuario | null> {
    const sesion = await this.authRepository.iniciarSesion(correo.trim(), contrasena);
    return this.userRepository.obtenerUsuario(sesion.uid);
  }
}
