import { Timestamp } from '@react-native-firebase/firestore';
import { ModoIntensidad, type Usuario } from '../../domain/entities';

/**
 * Forma del documento `usuarios/{uid}` en Firestore.
 * El `uid` no se guarda como campo: es el ID del documento.
 */
export interface UsuarioDoc {
  codigoParticipante: string;
  rangoEdad: string;
  genero: string;
  redesSocialesPrincipales: string[];
  gamaDispositivo: string;
  tiempoUsoDiarioBaseline: number;
  modoIntensidad: ModoIntensidad;
  motivacionPersonal: string;
  onboardingCompletado: boolean;
  activo: boolean;
  fechaRegistro: Timestamp;
}

export function usuarioADoc(usuario: Usuario): UsuarioDoc {
  return {
    codigoParticipante: usuario.codigoParticipante,
    rangoEdad: usuario.rangoEdad,
    genero: usuario.genero,
    redesSocialesPrincipales: usuario.redesSocialesPrincipales,
    gamaDispositivo: usuario.gamaDispositivo,
    tiempoUsoDiarioBaseline: usuario.tiempoUsoDiarioBaseline,
    modoIntensidad: usuario.modoIntensidad,
    motivacionPersonal: usuario.motivacionPersonal,
    onboardingCompletado: usuario.onboardingCompletado,
    activo: usuario.activo,
    fechaRegistro: Timestamp.fromDate(usuario.fechaRegistro),
  };
}

export function docAUsuario(uid: string, data: Partial<UsuarioDoc>): Usuario {
  return {
    uid,
    codigoParticipante: data.codigoParticipante ?? '',
    rangoEdad: data.rangoEdad ?? '',
    genero: data.genero ?? '',
    redesSocialesPrincipales: data.redesSocialesPrincipales ?? [],
    gamaDispositivo: data.gamaDispositivo ?? '',
    tiempoUsoDiarioBaseline: data.tiempoUsoDiarioBaseline ?? 0,
    modoIntensidad: data.modoIntensidad ?? ModoIntensidad.MEDIO,
    motivacionPersonal: data.motivacionPersonal ?? '',
    onboardingCompletado: data.onboardingCompletado ?? false,
    activo: data.activo ?? true,
    fechaRegistro: data.fechaRegistro?.toDate() ?? new Date(),
  };
}
