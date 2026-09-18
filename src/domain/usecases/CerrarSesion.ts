import type { AuthRepository } from '../repositories';

/** Cierra la sesión actual de Firebase Auth. */
export class CerrarSesion {
  constructor(private readonly authRepository: AuthRepository) {}

  ejecutar(): Promise<void> {
    return this.authRepository.cerrarSesion();
  }
}
