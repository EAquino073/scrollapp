package com.umg.scrollapp.usagestats

import android.content.Context

/**
 * Estado persistido del monitoreo, para poder reanudarlo al reiniciar el dispositivo
 * o si el sistema recrea el servicio.
 */
class Preferencias(contexto: Context) {
  private val prefs = contexto.getSharedPreferences("scrollapp_monitoreo", Context.MODE_PRIVATE)

  var monitoreoActivo: Boolean
    get() = prefs.getBoolean(CLAVE_ACTIVO, false)
    set(valor) = prefs.edit().putBoolean(CLAVE_ACTIVO, valor).apply()

  var paquetesMonitoreados: Set<String>
    get() = prefs.getStringSet(CLAVE_PAQUETES, emptySet())?.toSet() ?: emptySet()
    set(valor) = prefs.edit().putStringSet(CLAVE_PAQUETES, valor).apply()

  private companion object {
    const val CLAVE_ACTIVO = "monitoreo_activo"
    const val CLAVE_PAQUETES = "paquetes_monitoreados"
  }
}
