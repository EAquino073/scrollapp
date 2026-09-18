import type { MonitorDeUso } from '../repositories';

/** Gamas de dispositivo que contempla el estudio (ficha de datos generales). */
export const GAMAS_DISPOSITIVO = ['BAJA', 'MEDIA', 'ALTA'] as const;
export type GamaDispositivo = (typeof GAMAS_DISPOSITIVO)[number];

export interface SugerenciaGama {
  gama: GamaDispositivo;
  modelo: string;
  fabricante: string;
  ramGb: number;
}

/**
 * Sugiere la gama del dispositivo a partir de la RAM total (el usuario puede corregirla).
 * Umbrales orientativos para el mercado guatemalteco: ≤ 3.5 GB baja, ≤ 6.5 GB media, resto alta.
 */
export class DetectarGamaDispositivo {
  constructor(private readonly monitor: MonitorDeUso) {}

  async ejecutar(): Promise<SugerenciaGama> {
    const info = await this.monitor.obtenerInfoDispositivo();
    const ramGb = Math.round((info.ramMb / 1024) * 10) / 10;
    const gama: GamaDispositivo = ramGb <= 3.5 ? 'BAJA' : ramGb <= 6.5 ? 'MEDIA' : 'ALTA';
    return { gama, modelo: info.modelo, fabricante: info.fabricante, ramGb };
  }
}
