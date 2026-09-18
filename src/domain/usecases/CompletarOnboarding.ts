import {
  MINIMO_HABITOS,
  type ModoIntensidad,
  type ReplacementHabit,
  type ScrollTarget,
  type TipoActividad,
  type Usuario,
} from '../entities';
import type { HabitRepository, MonitorDeUso, ScrollRepository, UserRepository } from '../repositories';
import { generarId } from '../utilidades';

export interface HabitoNuevo {
  nombre: string;
  duracionMinutos: number;
  /** Código del catálogo si viene de las sugerencias; `null` si lo escribió el usuario. */
  tipoActividad: TipoActividad | null;
}

export interface DatosOnboarding {
  rangoEdad: string;
  genero: string;
  gamaDispositivo: string;
  motivacionPersonal: string;
  redesSociales: string[];
  habitos: HabitoNuevo[];
  modoIntensidad: ModoIntensidad;
}

/**
 * Cierra el onboarding: completa el documento del participante, crea una meta de
 * observación (`limiteMinutosDiarios = 0`, semana 1) por cada red elegida, guarda los
 * hábitos sustitutos e inicia el monitoreo si el permiso de uso está concedido.
 * `fechaRegistro` se fija aquí porque marca el inicio de la semana 1 (línea base).
 * El código de participante ya viene generado desde el registro.
 */
export class CompletarOnboarding {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly scrollRepository: ScrollRepository,
    private readonly habitRepository: HabitRepository,
    private readonly monitor: MonitorDeUso,
  ) {}

  async ejecutar(usuarioActual: Usuario, datos: DatosOnboarding): Promise<Usuario> {
    if (datos.redesSociales.length === 0) {
      throw new Error('Hace falta elegir al menos una red social');
    }
    if (datos.habitos.length < MINIMO_HABITOS) {
      throw new Error(`Hacen falta al menos ${MINIMO_HABITOS} actividades`);
    }

    const ahora = new Date();
    const usuario: Usuario = {
      ...usuarioActual,
      rangoEdad: datos.rangoEdad,
      genero: datos.genero,
      gamaDispositivo: datos.gamaDispositivo,
      motivacionPersonal: datos.motivacionPersonal.trim(),
      redesSocialesPrincipales: [...datos.redesSociales],
      modoIntensidad: datos.modoIntensidad,
      tiempoUsoDiarioBaseline: 0,
      onboardingCompletado: true,
      activo: true,
      fechaRegistro: ahora,
    };
    await this.userRepository.guardarUsuario(usuario);

    for (const redSocial of datos.redesSociales) {
      const meta: ScrollTarget = {
        targetId: generarId(),
        userId: usuario.uid,
        redSocial,
        limiteMinutosDiarios: 0,
        numeroSemana: 1,
        fechaCreacion: ahora,
        activo: true,
      };
      await this.scrollRepository.guardarMeta(meta);
    }

    for (const plantilla of datos.habitos) {
      const habito: ReplacementHabit = {
        habitId: generarId(),
        userId: usuario.uid,
        nombre: plantilla.nombre.trim(),
        duracionMinutos: plantilla.duracionMinutos,
        fechaCreacion: ahora,
        activo: true,
        tipoActividad: plantilla.tipoActividad,
      };
      await this.habitRepository.guardarHabito(habito);
    }

    if (this.monitor.consultarPermisos().accesoUso) {
      this.monitor.iniciarMonitoreo(datos.redesSociales);
    }

    return usuario;
  }
}
