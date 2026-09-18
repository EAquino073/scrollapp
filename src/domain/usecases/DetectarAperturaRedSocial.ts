import type { ScrollRepository, UserRepository } from '../repositories';

/** Resultado de una apertura detectada que sí corresponde mostrar la pausa. */
export interface AperturaRelevante {
  paquete: string;
  redSocial: string;
}

/**
 * Decide si una apertura detectada por el servicio nativo debe generar la pausa de
 * fricción: la red social tiene que estar entre las que el usuario eligió monitorear
 * (su perfil o una meta activa en `metasScroll`). Corresponde al caso de uso
 * `DetectarAperturaRedSocial` del diagrama de clases.
 */
export class DetectarAperturaRedSocial {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly scrollRepository: ScrollRepository,
  ) {}

  async ejecutar(uid: string, paquete: string, redSocial: string): Promise<AperturaRelevante | null> {
    const [usuario, metas] = await Promise.all([
      this.userRepository.obtenerUsuario(uid),
      this.scrollRepository.obtenerMetasActivas(uid),
    ]);
    const redesDelPerfil = usuario?.redesSocialesPrincipales ?? [];
    const redesConMeta = metas.map(meta => meta.redSocial);
    const monitoreada = redesDelPerfil.includes(redSocial) || redesConMeta.includes(redSocial);
    return monitoreada ? { paquete, redSocial } : null;
  }
}
