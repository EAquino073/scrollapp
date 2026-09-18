import { ModoIntensidad, type Usuario } from '../entities';
import type { AuthRepository, UserRepository } from '../repositories';
import { generarCodigoParticipante } from './generarCodigoParticipante';

/** Intentos de generar un código libre antes de quedarse con el último generado. */
const INTENTOS_CODIGO = 5;

/**
 * Crea la cuenta en Firebase Auth y el documento `usuarios/{uid}`.
 * El código de participante (`P-XXXX`) se genera aquí, automáticamente; el onboarding
 * ya no lo pide. El documento nace con `onboardingCompletado = false`.
 */
export class RegistrarUsuario {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /**
   * Genera un código y comprueba que esté libre. Si las reglas de seguridad no permiten
   * la consulta (devuelve `null`), se acepta el primero: con 4 caracteres de un alfabeto
   * de 31 símbolos hay 923.521 combinaciones y el estudio tiene 25 participantes.
   */
  private async codigoDisponible(): Promise<string> {
    let codigo = generarCodigoParticipante();
    for (let intento = 0; intento < INTENTOS_CODIGO; intento++) {
      const existe = await this.userRepository.existeCodigoParticipante(codigo);
      if (existe === null || existe === false) {
        return codigo;
      }
      codigo = generarCodigoParticipante();
    }
    return codigo;
  }

  async ejecutar(correo: string, contrasena: string): Promise<Usuario> {
    const sesion = await this.authRepository.registrar(correo.trim(), contrasena);

    const usuario: Usuario = {
      uid: sesion.uid,
      codigoParticipante: await this.codigoDisponible(),
      rangoEdad: '',
      genero: '',
      redesSocialesPrincipales: [],
      gamaDispositivo: '',
      tiempoUsoDiarioBaseline: 0,
      modoIntensidad: ModoIntensidad.MEDIO,
      motivacionPersonal: '',
      onboardingCompletado: false,
      activo: true,
      fechaRegistro: new Date(),
    };

    await this.userRepository.guardarUsuario(usuario);
    return usuario;
  }
}
