package com.umg.scrollapp

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.umg.scrollapp.notificaciones.DestinoPendiente
import com.umg.scrollapp.notificaciones.Notificaciones
import com.umg.scrollapp.usagestats.DetectorBus

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "ScrollApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    capturarFriccion(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    capturarFriccion(intent)
  }

  /**
   * Cuando el servicio de monitoreo abre esta actividad para mostrar la pausa de fricción,
   * guarda el paquete detectado para que JavaScript lo recoja con `obtenerFriccionPendiente`.
   */
  private fun capturarFriccion(intent: Intent?) {
    if (intent == null) return
    intent.getStringExtra(EXTRA_FRICCION_PAQUETE)?.let { paquete ->
      DetectorBus.guardarFriccionPendiente(paquete)
      intent.removeExtra(EXTRA_FRICCION_PAQUETE)
      intent.removeExtra(EXTRA_FRICCION_RED)
    }
    // La app también puede abrirse desde una notificación (check-in o revisión semanal).
    intent.getStringExtra(Notificaciones.EXTRA_DESTINO)?.let { destino ->
      DestinoPendiente.guardar(destino)
      intent.removeExtra(Notificaciones.EXTRA_DESTINO)
    }
  }

  companion object {
    const val EXTRA_FRICCION_PAQUETE = "friccion_paquete"
    const val EXTRA_FRICCION_RED = "friccion_red"
  }
}
