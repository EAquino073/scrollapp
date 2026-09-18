package com.umg.scrollapp.notificaciones

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.umg.scrollapp.R

/**
 * Recibe la alarma del check-in: muestra la notificación y reprograma la del día siguiente.
 * El texto es fijo y cálido; el resumen real del día se calcula en la app al abrirla.
 */
class RecordatorioReceiver : BroadcastReceiver() {
  override fun onReceive(contexto: Context, intent: Intent) {
    if (intent.action != ProgramadorRecordatorios.ACCION_CHECKIN) return
    Log.i("ScrollApp/Recordatorio", "Recordatorio de check-in disparado")
    Notificaciones.mostrar(
      contexto,
      Notificaciones.ID_CHECKIN,
      contexto.getString(R.string.notificacion_checkin_titulo),
      contexto.getString(R.string.notificacion_checkin_texto),
      Notificaciones.DESTINO_CHECKIN,
    )
    ProgramadorRecordatorios.reprogramarDesdePreferencias(contexto)
  }
}
