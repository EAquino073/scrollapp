package com.umg.scrollapp.usagestats

/**
 * Reglas puras de la detección (sin dependencias de Android) para decidir cuándo
 * disparar la pausa de fricción. Una "sesión de uso" de una red social termina cuando
 * la app lleva al menos `graciaMs` en segundo plano.
 *
 * - No se dispara mientras hay una fricción en curso para ese paquete; pero si la red
 *   social vuelve a primer plano pocos segundos después de lanzar la pausa y aún no hay
 *   decisión (p. ej. un diálogo del sistema se puso encima), se **refuerza**: se vuelve a
 *   traer la pantalla de fricción al frente, sin generar un evento nuevo.
 * - Si el usuario eligió CONTINUAR (o cerró la pausa), no se vuelve a disparar en la
 *   misma sesión de uso, aunque nuestra propia pantalla haya pausado la red social.
 * - Tras SUSTITUIR, la siguiente apertura vuelve a mostrar la pausa.
 */
class EstadoDeteccion(
  private val graciaMs: Long = 60_000L,
  private val expiracionFriccionMs: Long = 3 * 60_000L,
  private val ventanaRefuerzoMs: Long = 20_000L,
  private val maxRefuerzos: Int = 2,
) {
  enum class Accion { NADA, DISPARAR, REFORZAR }

  private class Estado {
    var enPrimerPlano = false
    var friccionDesde: Long? = null
    var decision: String? = null
    var ultimoSegundoPlano: Long? = null
    var refuerzos = 0
  }

  private val estados = HashMap<String, Estado>()

  @Volatile
  var paquetesMonitoreados: Set<String> = emptySet()

  /** Qué hacer cuando el paquete pasa a primer plano. */
  @Synchronized
  fun alPasarAPrimerPlano(paquete: String, ahora: Long): Accion {
    if (paquete !in paquetesMonitoreados) return Accion.NADA
    val estado = estados.getOrPut(paquete) { Estado() }
    val yaEstaba = estado.enPrimerPlano
    estado.enPrimerPlano = true
    if (yaEstaba) return Accion.NADA

    estado.friccionDesde?.let { desde ->
      if (ahora - desde < expiracionFriccionMs) {
        val sinDecision = estado.decision == null
        if (sinDecision && ahora - desde < ventanaRefuerzoMs && estado.refuerzos < maxRefuerzos) {
          estado.refuerzos++
          return Accion.REFORZAR
        }
        return Accion.NADA
      }
      estado.friccionDesde = null
    }

    val decisionConGracia = estado.decision == DECISION_CONTINUAR || estado.decision == DECISION_CANCELAR
    val ultimo = estado.ultimoSegundoPlano
    if (decisionConGracia && (ultimo == null || ahora - ultimo < graciaMs)) {
      return Accion.NADA
    }

    estado.decision = null
    estado.friccionDesde = ahora
    estado.refuerzos = 0
    return Accion.DISPARAR
  }

  @Synchronized
  fun alPasarASegundoPlano(paquete: String, ahora: Long) {
    val estado = estados[paquete] ?: return
    estado.enPrimerPlano = false
    estado.ultimoSegundoPlano = ahora
  }

  @Synchronized
  fun alDecidir(paquete: String, decision: String) {
    val estado = estados.getOrPut(paquete) { Estado() }
    estado.friccionDesde = null
    estado.decision = decision
  }

  @Synchronized
  fun reiniciar() = estados.clear()

  companion object {
    const val DECISION_CONTINUAR = "CONTINUAR"
    const val DECISION_SUSTITUIR = "SUSTITUIR"
    const val DECISION_CANCELAR = "CANCELAR"
  }
}
