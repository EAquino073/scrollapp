import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Contrato del TurboModule `UsageStats` (Kotlin, `android/.../usagestats/UsageStatsModule.kt`).
 * Codegen genera `NativeUsageStatsSpec` a partir de este archivo; cualquier cambio aquí
 * exige actualizar la implementación nativa y recompilar.
 */
export type UsoDeAppNativo = {
  paquete: string;
  minutosEnPrimerPlano: number;
  aperturas: number;
};

export type InfoDispositivoNativo = {
  modelo: string;
  fabricante: string;
  ramMb: number;
  versionAndroid: number;
};

export type AppInstaladaNativa = {
  paquete: string;
  nombre: string;
  /** PNG en base64 del icono de la app (96x96). */
  iconoBase64: string;
};

export interface Spec extends TurboModule {
  // Dispositivo y apps instaladas
  obtenerInfoDispositivo(): Promise<InfoDispositivoNativo>;
  obtenerAppsInstaladas(paquetes: string[]): Promise<AppInstaladaNativa[]>;

  // Permisos especiales
  tienePermisoUso(): boolean;
  abrirAjustesPermisoUso(): void;
  tienePermisoSuperposicion(): boolean;
  abrirAjustesSuperposicion(): void;
  estaExentoDeBateria(): boolean;
  solicitarExencionBateria(): void;

  // Consulta de uso
  obtenerUso(inicioMs: number, finMs: number, paquetes: string[]): Promise<UsoDeAppNativo[]>;
  obtenerAppEnPrimerPlano(): Promise<string | null>;

  // Servicio de monitoreo y fricción
  iniciarMonitoreo(paquetes: string[]): void;
  detenerMonitoreo(): void;
  estaMonitoreando(): boolean;
  obtenerFriccionPendiente(): string | null;
  informarDecision(paquete: string, decision: string): void;
  volverAAppAnterior(): void;

  // Requeridos por NativeEventEmitter
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('UsageStats');
