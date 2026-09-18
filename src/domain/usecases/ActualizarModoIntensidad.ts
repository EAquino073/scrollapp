import type { ModoIntensidad } from '../entities';
import type { UserRepository } from '../repositories';

/** El usuario controla la intensidad del acompañamiento: suave, medio o fuerte. */
export class ActualizarModoIntensidad {
  constructor(private readonly userRepository: UserRepository) {}

  ejecutar(uid: string, modo: ModoIntensidad): Promise<void> {
    return this.userRepository.actualizarModoIntensidad(uid, modo);
  }
}
