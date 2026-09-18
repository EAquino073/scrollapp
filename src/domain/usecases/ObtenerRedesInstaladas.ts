import type { MonitorDeUso, RedSocialInstaladaMonitoreo } from '../repositories';

/** Redes sociales monitoreables que están instaladas en el dispositivo (con icono y nombre). */
export class ObtenerRedesInstaladas {
  constructor(private readonly monitor: MonitorDeUso) {}

  async ejecutar(): Promise<RedSocialInstaladaMonitoreo[]> {
    const redes = await this.monitor.obtenerRedesInstaladas();
    return [...redes].sort((a, b) => a.redSocial.localeCompare(b.redSocial));
  }
}
