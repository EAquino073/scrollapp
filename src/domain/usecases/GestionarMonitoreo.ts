import type { EstadoPermisosMonitoreo, MonitorDeUso, UsoPorRedSocial } from '../repositories';

export interface EstadoMonitoreo {
  permisos: EstadoPermisosMonitoreo;
  activo: boolean;
  /** Todo lo necesario está concedido para poder iniciar. */
  listoParaIniciar: boolean;
}

/**
 * Orquesta el monitoreo nativo: estado de permisos, inicio/detención para las redes
 * que el usuario eligió y consulta del uso del día.
 */
export class GestionarMonitoreo {
  constructor(private readonly monitor: MonitorDeUso) {}

  consultarEstado(): EstadoMonitoreo {
    const permisos = this.monitor.consultarPermisos();
    return {
      permisos,
      activo: this.monitor.estaMonitoreando(),
      listoParaIniciar: permisos.accesoUso,
    };
  }

  abrirAjustesPermisoUso(): void {
    this.monitor.abrirAjustesPermisoUso();
  }

  abrirAjustesSuperposicion(): void {
    this.monitor.abrirAjustesSuperposicion();
  }

  solicitarExencionBateria(): void {
    this.monitor.solicitarExencionBateria();
  }

  /** Inicia el monitoreo. Devuelve `false` si no hay redes o falta el permiso de uso. */
  iniciar(redesSociales: string[]): boolean {
    if (redesSociales.length === 0 || !this.monitor.consultarPermisos().accesoUso) {
      return false;
    }
    this.monitor.iniciarMonitoreo(redesSociales);
    return true;
  }

  detener(): void {
    this.monitor.detenerMonitoreo();
  }

  usoDelDia(redesSociales: string[]): Promise<UsoPorRedSocial[]> {
    if (redesSociales.length === 0 || !this.monitor.consultarPermisos().accesoUso) {
      return Promise.resolve([]);
    }
    return this.monitor.obtenerUsoDelDia(redesSociales);
  }
}
