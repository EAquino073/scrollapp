/**
 * Puerto del monitoreo de uso del dispositivo. Lo implementa la fachada del módulo
 * nativo (`src/native/usagestats/UsageStats.ts`); el dominio solo conoce esta interfaz.
 */
export interface UsoPorRedSocial {
  redSocial: string;
  paquete: string;
  minutosEnPrimerPlano: number;
  aperturas: number;
}

export interface EstadoPermisosMonitoreo {
  accesoUso: boolean;
  superposicion: boolean;
  exentoBateria: boolean;
}

export interface AperturaDetectadaMonitoreo {
  paquete: string;
  redSocial: string;
}

export type DecisionMonitoreo = 'CONTINUAR' | 'SUSTITUIR' | 'CANCELAR';

export interface Suscripcion {
  remove(): void;
}

export interface RedSocialInstaladaMonitoreo {
  redSocial: string;
  paquete: string;
  nombre: string;
  iconoUri: string;
}

export interface InfoDispositivoMonitoreo {
  modelo: string;
  fabricante: string;
  ramMb: number;
  versionAndroid: number;
}

export interface MonitorDeUso {
  obtenerInfoDispositivo(): Promise<InfoDispositivoMonitoreo>;
  obtenerRedesInstaladas(): Promise<RedSocialInstaladaMonitoreo[]>;
  consultarPermisos(): EstadoPermisosMonitoreo;
  abrirAjustesPermisoUso(): void;
  abrirAjustesSuperposicion(): void;
  solicitarExencionBateria(): void;
  obtenerUsoPorRedSocial(inicio: Date, fin: Date, redesSociales: string[]): Promise<UsoPorRedSocial[]>;
  obtenerUsoDelDia(redesSociales: string[]): Promise<UsoPorRedSocial[]>;
  iniciarMonitoreo(redesSociales: string[]): void;
  detenerMonitoreo(): void;
  estaMonitoreando(): boolean;
  tomarAperturaPendiente(): AperturaDetectadaMonitoreo | null;
  informarDecision(paquete: string, decision: DecisionMonitoreo): void;
  volverAAppAnterior(): void;
  alDetectarApertura(callback: (apertura: AperturaDetectadaMonitoreo) => void): Suscripcion;
}
