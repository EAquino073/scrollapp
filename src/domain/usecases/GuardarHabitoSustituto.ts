import type { ReplacementHabit, TipoActividad } from '../entities';
import type { HabitRepository } from '../repositories';
import { generarId } from '../utilidades';

export interface DatosHabito {
  nombre: string;
  duracionMinutos: number;
  /** Código del catálogo si viene de las sugerencias; `null` si lo escribió el usuario. */
  tipoActividad: TipoActividad | null;
}

/** Crea, edita o activa/desactiva una actividad sustituta. */
export class GuardarHabitoSustituto {
  constructor(private readonly habitRepository: HabitRepository) {}

  async crear(uid: string, datos: DatosHabito): Promise<ReplacementHabit> {
    const habito: ReplacementHabit = {
      habitId: generarId(),
      userId: uid,
      nombre: datos.nombre.trim(),
      duracionMinutos: datos.duracionMinutos,
      fechaCreacion: new Date(),
      activo: true,
      tipoActividad: datos.tipoActividad,
    };
    await this.habitRepository.guardarHabito(habito);
    return habito;
  }

  /** Al editar se conserva el tipo original: no se convierte una predeterminada en propia. */
  async editar(habito: ReplacementHabit, datos: DatosHabito): Promise<ReplacementHabit> {
    const actualizado: ReplacementHabit = {
      ...habito,
      nombre: datos.nombre.trim(),
      duracionMinutos: datos.duracionMinutos,
    };
    await this.habitRepository.guardarHabito(actualizado);
    return actualizado;
  }

  async cambiarActivo(habito: ReplacementHabit, activo: boolean): Promise<ReplacementHabit> {
    const actualizado: ReplacementHabit = { ...habito, activo };
    await this.habitRepository.guardarHabito(actualizado);
    return actualizado;
  }
}
