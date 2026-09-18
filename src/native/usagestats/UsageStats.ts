import { NativeEventEmitter, type EmitterSubscription } from 'react-native';
import NativeUsageStats, { type UsoDeAppNativo } from '../specs/NativeUsageStats';

/**
 * Fachada en español del módulo nativo `UsageStats` (Kotlin). Es el único punto de
 * contacto de la app con el monitoreo de Android; los casos de uso dependen de esta
 * interfaz y no del TurboModule directamente.
 */

/** Uso de una app en un rango de tiempo, medido con UsageStatsManager. */
export interface UsoDeApp {
  /** Nombre de paquete Android, p. ej. `com.instagram.android`. */
  paquete: string;
  minutosEnPrimerPlano: number;
  aperturas: number;
}

/** Apertura de una red social detectada por el servicio de monitoreo. */
export interface AperturaDetectada {
  paquete: string;
  redSocial: string;
}

/** Decisión que JavaScript comunica al servicio para no repetir la pausa en la misma sesión. */
export type DecisionMonitoreo = 'CONTINUAR' | 'SUSTITUIR' | 'CANCELAR';

export interface EstadoPermisos {
  accesoUso: boolean;
  superposicion: boolean;
  exentoBateria: boolean;
}

/**
 * Paquetes Android de las redes sociales monitoreables.
 * La clave es el nombre que ve el usuario y que se guarda en `redSocial`.
 * Debe coincidir con `RedesSociales.kt`.
 */
export const PAQUETES_REDES_SOCIALES: Record<string, string> = {
  Instagram: 'com.instagram.android',
  TikTok: 'com.zhiliaoapp.musically',
  Facebook: 'com.facebook.katana',
  X: 'com.twitter.android',
  YouTube: 'com.google.android.youtube',
  Snapchat: 'com.snapchat.android',
  Threads: 'com.instagram.barcelona',
};

export const REDES_SOCIALES_DISPONIBLES = Object.keys(PAQUETES_REDES_SOCIALES);

export function paqueteDeRedSocial(redSocial: string): string | undefined {
  return PAQUETES_REDES_SOCIALES[redSocial];
}

export function redSocialDePaquete(paquete: string): string | undefined {
  return REDES_SOCIALES_DISPONIBLES.find(red => PAQUETES_REDES_SOCIALES[red] === paquete);
}

const EVENTO_APERTURA = 'aperturaDetectada';
const emisor = new NativeEventEmitter(NativeUsageStats);

/** Red social monitoreable que está instalada en el dispositivo, con su icono real. */
export interface RedSocialInstalada {
  redSocial: string;
  paquete: string;
  nombre: string;
  /** URI `data:image/png;base64,...` lista para `Image`. */
  iconoUri: string;
}

export interface InfoDispositivo {
  modelo: string;
  fabricante: string;
  ramMb: number;
  versionAndroid: number;
}

export const UsageStats = {
  // ------------------------------------------------------------ dispositivo
  obtenerInfoDispositivo(): Promise<InfoDispositivo> {
    return NativeUsageStats.obtenerInfoDispositivo();
  },
  /** De las redes monitoreables, cuáles están instaladas (con nombre e icono). */
  async obtenerRedesInstaladas(): Promise<RedSocialInstalada[]> {
    const apps = await NativeUsageStats.obtenerAppsInstaladas(Object.values(PAQUETES_REDES_SOCIALES));
    return apps.map(app => ({
      redSocial: redSocialDePaquete(app.paquete) ?? app.nombre,
      paquete: app.paquete,
      nombre: app.nombre,
      iconoUri: `data:image/png;base64,${app.iconoBase64}`,
    }));
  },

  // ------------------------------------------------------------ permisos
  consultarPermisos(): EstadoPermisos {
    return {
      accesoUso: NativeUsageStats.tienePermisoUso(),
      superposicion: NativeUsageStats.tienePermisoSuperposicion(),
      exentoBateria: NativeUsageStats.estaExentoDeBateria(),
    };
  },
  abrirAjustesPermisoUso(): void {
    NativeUsageStats.abrirAjustesPermisoUso();
  },
  abrirAjustesSuperposicion(): void {
    NativeUsageStats.abrirAjustesSuperposicion();
  },
  solicitarExencionBateria(): void {
    NativeUsageStats.solicitarExencionBateria();
  },

  // ------------------------------------------------------------ uso
  /** Uso por red social entre dos instantes. Devuelve una entrada por red pedida. */
  async obtenerUsoPorRedSocial(
    inicio: Date,
    fin: Date,
    redesSociales: string[],
  ): Promise<Array<UsoDeApp & { redSocial: string }>> {
    const paquetes = redesSociales.map(paqueteDeRedSocial).filter((p): p is string => !!p);
    const usos: UsoDeAppNativo[] = await NativeUsageStats.obtenerUso(
      inicio.getTime(),
      fin.getTime(),
      paquetes,
    );
    return usos.map(uso => ({
      ...uso,
      redSocial: redSocialDePaquete(uso.paquete) ?? uso.paquete,
    }));
  },
  /** Uso del día actual (desde las 00:00 locales) para las redes indicadas. */
  obtenerUsoDelDia(redesSociales: string[]) {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    return UsageStats.obtenerUsoPorRedSocial(inicio, new Date(), redesSociales);
  },
  obtenerAppEnPrimerPlano(): Promise<string | null> {
    return NativeUsageStats.obtenerAppEnPrimerPlano();
  },

  // ------------------------------------------------------------ monitoreo
  iniciarMonitoreo(redesSociales: string[]): void {
    const paquetes = redesSociales.map(paqueteDeRedSocial).filter((p): p is string => !!p);
    NativeUsageStats.iniciarMonitoreo(paquetes);
  },
  detenerMonitoreo(): void {
    NativeUsageStats.detenerMonitoreo();
  },
  estaMonitoreando(): boolean {
    return NativeUsageStats.estaMonitoreando();
  },
  /** Apertura detectada mientras JavaScript no estaba escuchando, o `null`. */
  tomarAperturaPendiente(): AperturaDetectada | null {
    const paquete = NativeUsageStats.obtenerFriccionPendiente();
    if (!paquete) {
      return null;
    }
    return { paquete, redSocial: redSocialDePaquete(paquete) ?? paquete };
  },
  informarDecision(paquete: string, decision: DecisionMonitoreo): void {
    NativeUsageStats.informarDecision(paquete, decision);
  },
  /** Envía ScrollApp al fondo para que el usuario vuelva a la app que tenía abierta. */
  volverAAppAnterior(): void {
    NativeUsageStats.volverAAppAnterior();
  },
  /** Se suscribe a las aperturas detectadas en tiempo real. Devuelve la suscripción para cancelarla. */
  alDetectarApertura(callback: (apertura: AperturaDetectada) => void): EmitterSubscription {
    return emisor.addListener(EVENTO_APERTURA, datos => callback(datos as AperturaDetectada));
  },
};

export type UsageStatsModulo = typeof UsageStats;
