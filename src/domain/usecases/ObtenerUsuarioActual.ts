import type { Usuario } from '../entities';
import type { AuthRepository, UserRepository } from '../repositories';

/** Devuelve el participante con sesión activa, o `null` si no hay sesión. */
export class ObtenerUsuarioActual {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async ejecutar(): Promise<Usuario | null> {
    const sesion = this.authRepository.sesionActual();
    if (!sesion) {
      return null;
    }
    return this.userRepository.obtenerUsuario(sesion.uid);
  }
}
