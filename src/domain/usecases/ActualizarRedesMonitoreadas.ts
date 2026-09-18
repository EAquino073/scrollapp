import type { ScrollTarget } from '../entities';
import type { MonitorDeUso, ScrollRepository, UserRepository } from '../repositories';
import { generarId, numeroSemanaDelEstudio } from '../utilidades';

/**
 * Cambia desde Ajustes qué redes acompaña la app: actualiza el perfil, desactiva las metas
 * de las redes quitadas, crea metas de observación para las nuevas y reinicia el monitoreo
 * con la lista actual si estaba activo.
 */
export class ActualizarRedesMonitoreadas {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly scrollRepository: ScrollRepository,
    private readonly monitor: MonitorDeUso,
  ) {}

  async ejecutar(uid: string, fechaRegistro: Date, redesSociales: string[]): Promise<void> {
    if (redesSociales.length === 0) {
      throw new Error('Hace falta mantener al menos una red social');
    }

    await this.userRepository.actualizarCampos(uid, { redesSocialesPrincipales: [...redesSociales] });

    const metasActivas = await this.scrollRepository.obtenerMetasActivas(uid);
    const ahora = new Date();
    const semana = numeroSemanaDelEstudio(fechaRegistro, ahora);

    for (const meta of metasActivas) {
      if (!redesSociales.includes(meta.redSocial)) {
        await this.scrollRepository.guardarMeta({ ...meta, activo: false });
      }
    }
    for (const redSocial of redesSociales) {
      const yaTieneMeta = metasActivas.some(meta => meta.redSocial === redSocial);
      if (yaTieneMeta) {
        continue;
      }
      const meta: ScrollTarget = {
        targetId: generarId(),
        userId: uid,
        redSocial,
        limiteMinutosDiarios: 0,
        numeroSemana: semana,
        fechaCreacion: ahora,
        activo: true,
      };
      await this.scrollRepository.guardarMeta(meta);
    }

    if (this.monitor.estaMonitoreando()) {
      this.monitor.iniciarMonitoreo(redesSociales);
    }
  }
}
