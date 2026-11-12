import { BancoContenidoLocal, FRASES_PAUSA } from '../data/contenido';
import {
  AuthFirebaseRepository,
  EncuestaFirestoreRepository,
  HabitFirestoreRepository,
  ReflexionFirestoreRepository,
  ScrollFirestoreRepository,
  SesionFirestoreRepository,
  StatsFirestoreRepository,
  UsuarioFirestoreRepository,
} from '../data/firestore';
import { RotacionAsyncStorageRepository } from '../data/local';
import type {
  BancoContenido,
  MonitorDeUso,
  RecordatoriosLocales,
  RotacionRepository,
} from '../domain/repositories';
import {
  ActualizarModoIntensidad,
  ActualizarRedesMonitoreadas,
  AjustarMetaProgresiva,
  AsignarContenidoGuiado,
  CalcularCheckInNocturno,
  CalcularLineaBase,
  CerrarSemanasPendientes,
  CerrarSesion,
  CompletarOnboarding,
  DetectarAperturaRedSocial,
  DetectarGamaDispositivo,
  GenerarMensajeFriccion,
  GenerarRevisionSemanal,
  GestionarMonitoreo,
  GestionarRecordatorios,
  GuardarHabitoSustituto,
  GuardarRespuestaEncuesta,
  IniciarSesion,
  ObtenerHabitosSustitutos,
  ObtenerRedesInstaladas,
  ObtenerUsuarioActual,
  RegistrarCumplimientoHabito,
  RegistrarDecisionFriccion,
  RegistrarReflexionDiaria,
  RegistrarSesionApp,
  RegistrarUsoAutomatico,
  RegistrarUsuario,
  SugerirHabitoSustituto,
} from '../domain/usecases';
import { Notificaciones } from '../native/notificaciones/Notificaciones';
import { UsageStats } from '../native/usagestats/UsageStats';

/**
 * Contenedor de dependencias (inyección manual).
 * Aquí se decide qué implementación concreta recibe cada caso de uso.
 * Las pantallas y ViewModels solo conocen los casos de uso, nunca Firestore ni los módulos nativos.
 */
const authRepository = new AuthFirebaseRepository();
const userRepository = new UsuarioFirestoreRepository();
const scrollRepository = new ScrollFirestoreRepository();
const habitRepository = new HabitFirestoreRepository();
const reflectionRepository = new ReflexionFirestoreRepository();
const statsRepository = new StatsFirestoreRepository();
const sessionRepository = new SesionFirestoreRepository();
const surveyRepository = new EncuestaFirestoreRepository();
const monitorDeUso: MonitorDeUso = UsageStats;
const recordatoriosLocales: RecordatoriosLocales = Notificaciones;
const bancoContenido: BancoContenido = new BancoContenidoLocal();
const rotacionRepository: RotacionRepository = new RotacionAsyncStorageRepository();

const registrarUsoAutomatico = new RegistrarUsoAutomatico(monitorDeUso, scrollRepository);
const generarRevisionSemanal = new GenerarRevisionSemanal(
  scrollRepository,
  habitRepository,
  statsRepository,
  sessionRepository,
);
const ajustarMetaProgresiva = new AjustarMetaProgresiva(scrollRepository);
const calcularLineaBase = new CalcularLineaBase(monitorDeUso, scrollRepository, userRepository);
const gestionarRecordatorios = new GestionarRecordatorios(recordatoriosLocales);

export const contenedor = {
  repositorios: {
    auth: authRepository,
    usuarios: userRepository,
    scroll: scrollRepository,
    habitos: habitRepository,
    reflexiones: reflectionRepository,
    estadisticas: statsRepository,
    sesiones: sessionRepository,
    encuesta: surveyRepository,
    monitorDeUso,
    recordatorios: recordatoriosLocales,
    bancoContenido,
    rotacion: rotacionRepository,
  },
  casosDeUso: {
    // Sesión
    registrarUsuario: new RegistrarUsuario(authRepository, userRepository),
    iniciarSesion: new IniciarSesion(authRepository, userRepository),
    cerrarSesion: new CerrarSesion(authRepository),
    obtenerUsuarioActual: new ObtenerUsuarioActual(authRepository, userRepository),
    registrarSesionApp: new RegistrarSesionApp(sessionRepository),
    // Onboarding
    completarOnboarding: new CompletarOnboarding(userRepository, scrollRepository, habitRepository, monitorDeUso),
    detectarGamaDispositivo: new DetectarGamaDispositivo(monitorDeUso),
    obtenerRedesInstaladas: new ObtenerRedesInstaladas(monitorDeUso),
    // Ajustes, monitoreo y recordatorios
    actualizarModoIntensidad: new ActualizarModoIntensidad(userRepository),
    actualizarRedesMonitoreadas: new ActualizarRedesMonitoreadas(userRepository, scrollRepository, monitorDeUso),
    gestionarMonitoreo: new GestionarMonitoreo(monitorDeUso),
    gestionarRecordatorios,
    detectarAperturaRedSocial: new DetectarAperturaRedSocial(userRepository, scrollRepository),
    // Actividades, fricción y sustitución
    obtenerHabitosSustitutos: new ObtenerHabitosSustitutos(habitRepository),
    guardarHabitoSustituto: new GuardarHabitoSustituto(habitRepository),
    sugerirHabitoSustituto: new SugerirHabitoSustituto(habitRepository),
    registrarDecisionFriccion: new RegistrarDecisionFriccion(scrollRepository, habitRepository),
    registrarCumplimientoHabito: new RegistrarCumplimientoHabito(habitRepository),
    // Contenido guiado de las actividades predeterminadas (fase 5)
    asignarContenidoGuiado: new AsignarContenidoGuiado(bancoContenido, rotacionRepository),
    generarMensajeFriccion: new GenerarMensajeFriccion(monitorDeUso, FRASES_PAUSA),
    // Check-in nocturno y registro automático
    registrarUsoAutomatico,
    calcularCheckInNocturno: new CalcularCheckInNocturno(
      scrollRepository,
      habitRepository,
      reflectionRepository,
      registrarUsoAutomatico,
    ),
    registrarReflexionDiaria: new RegistrarReflexionDiaria(reflectionRepository),
    // Línea base, revisión semanal y metas progresivas
    calcularLineaBase,
    generarRevisionSemanal,
    ajustarMetaProgresiva,
    cerrarSemanasPendientes: new CerrarSemanasPendientes(
      statsRepository,
      generarRevisionSemanal,
      ajustarMetaProgresiva,
      calcularLineaBase,
      registrarUsoAutomatico,
      gestionarRecordatorios,
    ),
    // Encuesta final
    guardarRespuestaEncuesta: new GuardarRespuestaEncuesta(surveyRepository),
  },
};

export type Contenedor = typeof contenedor;
