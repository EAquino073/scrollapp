package com.umg.scrollapp.usagestats

/**
 * Punto de encuentro entre el servicio de monitoreo (que vive aunque React no esté
 * cargado) y el módulo nativo (que solo existe mientras hay contexto de React).
 *
 * - Si hay un oyente registrado, se le avisa de inmediato (evento a JavaScript).
 * - Siempre se guarda la apertura como "fricción pendiente" para que JavaScript la
 *   recoja al arrancar o al volver a primer plano.
 */
object DetectorBus {
  interface Oyente {
    fun alDetectarApertura(paquete: String, redSocial: String)
  }

  @Volatile
  private var oyente: Oyente? = null

  @Volatile
  private var friccionPendiente: String? = null

  fun registrar(nuevo: Oyente?) {
    oyente = nuevo
  }

  fun publicarApertura(paquete: String, redSocial: String) {
    friccionPendiente = paquete
    oyente?.alDetectarApertura(paquete, redSocial)
  }

  fun guardarFriccionPendiente(paquete: String) {
    friccionPendiente = paquete
  }

  /** Devuelve y limpia la fricción pendiente. */
  fun tomarFriccionPendiente(): String? {
    val paquete = friccionPendiente
    friccionPendiente = null
    return paquete
  }
}
