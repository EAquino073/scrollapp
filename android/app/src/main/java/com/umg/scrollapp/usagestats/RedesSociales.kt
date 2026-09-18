package com.umg.scrollapp.usagestats

/**
 * Redes sociales que la app puede monitorear, indexadas por nombre de paquete Android.
 * Debe coincidir con `PAQUETES_REDES_SOCIALES` en `src/native/usagestats/UsageStats.ts`.
 */
object RedesSociales {
  val PAQUETES: Map<String, String> = linkedMapOf(
    "com.instagram.android" to "Instagram",
    "com.zhiliaoapp.musically" to "TikTok",
    "com.facebook.katana" to "Facebook",
    "com.twitter.android" to "X",
    "com.google.android.youtube" to "YouTube",
    "com.snapchat.android" to "Snapchat",
    "com.instagram.barcelona" to "Threads",
  )

  fun nombreDe(paquete: String): String = PAQUETES[paquete] ?: paquete
}
