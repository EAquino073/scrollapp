package com.umg.scrollapp.usagestats

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import com.umg.scrollapp.notificaciones.ProgramadorRecordatorios

/**
 * Reanuda el monitoreo al reiniciar el dispositivo si el usuario lo había activado
 * y el permiso de uso sigue concedido.
 */
class ArranqueReceiver : BroadcastReceiver() {
  override fun onReceive(contexto: Context, intent: Intent) {
    val acciones = setOf(Intent.ACTION_BOOT_COMPLETED, "android.intent.action.QUICKBOOT_POWERON")
    if (intent.action !in acciones) return

    // Las alarmas se pierden al reiniciar: se vuelve a programar el check-in.
    ProgramadorRecordatorios.reprogramarDesdePreferencias(contexto)

    val preferencias = Preferencias(contexto)
    if (!preferencias.monitoreoActivo || !Permisos.tienePermisoUso(contexto)) return
    Log.i("ScrollApp/Arranque", "Reanudando monitoreo tras el arranque")
    MonitoreoService.iniciar(contexto, preferencias.paquetesMonitoreados)
  }
}
