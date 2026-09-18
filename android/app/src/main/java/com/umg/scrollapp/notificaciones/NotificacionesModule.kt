package com.umg.scrollapp.notificaciones

import com.facebook.react.bridge.ReactApplicationContext
import com.umg.scrollapp.specs.NativeNotificacionesSpec

/**
 * TurboModule `Notificaciones`: recordatorios locales del check-in nocturno y aviso de la
 * revisión semanal. El contrato TypeScript está en `src/native/specs/NativeNotificaciones.ts`.
 */
class NotificacionesModule(private val contexto: ReactApplicationContext) :
  NativeNotificacionesSpec(contexto) {

  override fun getName(): String = NAME

  override fun programarCheckInDiario(hora: Double, minuto: Double) {
    ProgramadorRecordatorios.programarCheckIn(contexto, hora.toInt(), minuto.toInt())
  }

  override fun cancelarCheckInDiario() = ProgramadorRecordatorios.cancelarCheckIn(contexto)

  override fun estaProgramadoCheckIn(): Boolean = PreferenciasRecordatorios(contexto).checkInActivo

  override fun horaCheckIn(): Double = PreferenciasRecordatorios(contexto).checkInHora.toDouble()

  override fun minutoCheckIn(): Double = PreferenciasRecordatorios(contexto).checkInMinuto.toDouble()

  override fun mostrarAvisoRevisionSemanal(titulo: String, texto: String) {
    Notificaciones.mostrar(
      contexto,
      Notificaciones.ID_REVISION,
      titulo,
      texto,
      Notificaciones.DESTINO_REVISION,
    )
  }

  /** Destino pendiente si la app se abrió tocando una notificación (se consume al leerlo). */
  override fun obtenerDestinoPendiente(): String? = DestinoPendiente.tomar()

  companion object {
    const val NAME = "Notificaciones"
  }
}

/** Puente entre `MainActivity` (que recibe el intent) y JavaScript. */
object DestinoPendiente {
  @Volatile
  private var destino: String? = null

  fun guardar(nuevo: String?) {
    if (nuevo != null) {
      destino = nuevo
    }
  }

  fun tomar(): String? {
    val actual = destino
    destino = null
    return actual
  }
}
