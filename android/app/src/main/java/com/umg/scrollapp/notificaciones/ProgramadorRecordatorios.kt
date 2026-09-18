package com.umg.scrollapp.notificaciones

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.util.Log
import java.util.Calendar

/**
 * Programa el recordatorio diario del check-in con `AlarmManager`.
 *
 * Se usa `setAndAllowWhileIdle` (inexacto, con margen de unos minutos bajo Doze) en lugar
 * de una alarma exacta: no requiere el permiso `SCHEDULE_EXACT_ALARM` de Android 12+ y para
 * un check-in de la noche el margen es irrelevante. El receptor reprograma la siguiente.
 */
object ProgramadorRecordatorios {
  const val ACCION_CHECKIN = "com.umg.scrollapp.RECORDATORIO_CHECKIN"
  private const val CODIGO_CHECKIN = 3001
  private const val TAG = "ScrollApp/Recordatorio"

  fun programarCheckIn(contexto: Context, hora: Int, minuto: Int) {
    PreferenciasRecordatorios(contexto).apply {
      checkInActivo = true
      checkInHora = hora
      checkInMinuto = minuto
    }
    programarSiguiente(contexto, hora, minuto)
  }

  fun cancelarCheckIn(contexto: Context) {
    PreferenciasRecordatorios(contexto).checkInActivo = false
    alarmManager(contexto).cancel(pendiente(contexto))
    Notificaciones.cancelar(contexto, Notificaciones.ID_CHECKIN)
    Log.i(TAG, "Recordatorio de check-in cancelado")
  }

  /** Reprograma con la hora guardada (tras el arranque o tras disparar la alarma). */
  fun reprogramarDesdePreferencias(contexto: Context) {
    val prefs = PreferenciasRecordatorios(contexto)
    if (!prefs.checkInActivo) return
    programarSiguiente(contexto, prefs.checkInHora, prefs.checkInMinuto)
  }

  private fun programarSiguiente(contexto: Context, hora: Int, minuto: Int) {
    val ahora = Calendar.getInstance()
    val objetivo = Calendar.getInstance().apply {
      set(Calendar.HOUR_OF_DAY, hora)
      set(Calendar.MINUTE, minuto)
      set(Calendar.SECOND, 0)
      set(Calendar.MILLISECOND, 0)
      if (timeInMillis <= ahora.timeInMillis) {
        add(Calendar.DAY_OF_YEAR, 1)
      }
    }
    alarmManager(contexto).setAndAllowWhileIdle(
      AlarmManager.RTC_WAKEUP,
      objetivo.timeInMillis,
      pendiente(contexto),
    )
    Log.i(TAG, "Check-in programado para ${objetivo.time}")
  }

  private fun alarmManager(contexto: Context) =
    contexto.getSystemService(Context.ALARM_SERVICE) as AlarmManager

  private fun pendiente(contexto: Context): PendingIntent {
    val intent = Intent(contexto, RecordatorioReceiver::class.java).setAction(ACCION_CHECKIN)
    return PendingIntent.getBroadcast(
      contexto,
      CODIGO_CHECKIN,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
  }
}

/** Hora del check-in y si está activo, para poder reprogramar tras un reinicio. */
class PreferenciasRecordatorios(contexto: Context) {
  private val prefs = contexto.getSharedPreferences("scrollapp_recordatorios", Context.MODE_PRIVATE)

  var checkInActivo: Boolean
    get() = prefs.getBoolean("checkin_activo", false)
    set(valor) = prefs.edit().putBoolean("checkin_activo", valor).apply()

  var checkInHora: Int
    get() = prefs.getInt("checkin_hora", 21)
    set(valor) = prefs.edit().putInt("checkin_hora", valor).apply()

  var checkInMinuto: Int
    get() = prefs.getInt("checkin_minuto", 0)
    set(valor) = prefs.edit().putInt("checkin_minuto", valor).apply()
}
