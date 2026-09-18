package com.umg.scrollapp.usagestats

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager

/** Uso de una app en un rango de tiempo, calculado a partir de los eventos de UsageStats. */
data class UsoDeApp(val paquete: String, val milisegundosEnPrimerPlano: Long, val aperturas: Int)

/**
 * Calcula tiempo en primer plano y número de aperturas por paquete recorriendo
 * `UsageStatsManager.queryEvents`. Se usan eventos en vez de `queryUsageStats`
 * porque los agregados del sistema no respetan rangos arbitrarios con precisión.
 *
 * Una "apertura" se cuenta cuando el paquete pasa a primer plano viniendo de otra app;
 * cambiar de pantalla dentro de la misma app no cuenta como nueva apertura.
 */
object CalculadorUso {
  // ACTIVITY_RESUMED (API 29) comparte valor con MOVE_TO_FOREGROUND (1); igual para
  // ACTIVITY_PAUSED / MOVE_TO_BACKGROUND (2). ACTIVITY_STOPPED (23) existe desde API 29.
  const val EVENTO_PRIMER_PLANO = 1
  const val EVENTO_PAUSA = 2
  const val EVENTO_DETENIDA = 23

  fun calcular(
    usageStats: UsageStatsManager,
    inicio: Long,
    fin: Long,
    paquetes: Set<String>,
  ): List<UsoDeApp> {
    val eventos = usageStats.queryEvents(inicio, fin)
    val evento = UsageEvents.Event()
    val tiempo = HashMap<String, Long>()
    val aperturas = HashMap<String, Int>()
    val inicioSesion = HashMap<String, Long>()
    var enPrimerPlano: String? = null

    while (eventos.hasNextEvent()) {
      eventos.getNextEvent(evento)
      val paquete = evento.packageName ?: continue
      when (evento.eventType) {
        EVENTO_PRIMER_PLANO -> {
          if (paquete in paquetes) {
            if (enPrimerPlano != paquete) {
              aperturas[paquete] = (aperturas[paquete] ?: 0) + 1
            }
            if (inicioSesion[paquete] == null) {
              inicioSesion[paquete] = evento.timeStamp
            }
          }
          enPrimerPlano = paquete
        }
        EVENTO_PAUSA, EVENTO_DETENIDA -> {
          if (paquete in paquetes) {
            inicioSesion.remove(paquete)?.let { desde ->
              tiempo[paquete] = (tiempo[paquete] ?: 0L) + (evento.timeStamp - desde).coerceAtLeast(0)
            }
          }
        }
      }
    }

    // Sesiones que siguen abiertas al final del rango.
    for ((paquete, desde) in inicioSesion) {
      tiempo[paquete] = (tiempo[paquete] ?: 0L) + (fin - desde).coerceAtLeast(0)
    }

    return paquetes.map { UsoDeApp(it, tiempo[it] ?: 0L, aperturas[it] ?: 0) }
  }

  /** Último paquete que pasó a primer plano dentro del rango, o `null`. */
  fun ultimoEnPrimerPlano(usageStats: UsageStatsManager, inicio: Long, fin: Long): String? {
    val eventos = usageStats.queryEvents(inicio, fin)
    val evento = UsageEvents.Event()
    var ultimo: String? = null
    while (eventos.hasNextEvent()) {
      eventos.getNextEvent(evento)
      if (evento.eventType == EVENTO_PRIMER_PLANO) {
        ultimo = evento.packageName
      }
    }
    return ultimo
  }
}
