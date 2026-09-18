package com.umg.scrollapp.usagestats

import android.Manifest
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings

/**
 * Consulta y solicitud de los permisos especiales que necesita el monitoreo:
 * - Acceso a datos de uso (PACKAGE_USAGE_STATS): se concede en Ajustes, no por diálogo.
 * - Mostrar sobre otras apps (SYSTEM_ALERT_WINDOW): permite lanzar la pantalla de fricción
 *   encima de la red social cuando la app está en segundo plano.
 * - Exención de optimización de batería: evita que el sistema detenga el servicio.
 */
object Permisos {

  fun tienePermisoUso(contexto: Context): Boolean {
    val appOps = contexto.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val modo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), contexto.packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), contexto.packageName,
      )
    }
    return if (modo == AppOpsManager.MODE_DEFAULT) {
      contexto.checkCallingOrSelfPermission(Manifest.permission.PACKAGE_USAGE_STATS) ==
        PackageManager.PERMISSION_GRANTED
    } else {
      modo == AppOpsManager.MODE_ALLOWED
    }
  }

  fun intentAjustesUso(contexto: Context): Intent {
    // Algunos fabricantes aceptan la URI del paquete y abren directo la fila de la app.
    val conPaquete = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS, Uri.parse("package:${contexto.packageName}"))
    val generico = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS)
    val elegido = if (conPaquete.resolveActivity(contexto.packageManager) != null) conPaquete else generico
    return elegido.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
  }

  fun tienePermisoSuperposicion(contexto: Context): Boolean = Settings.canDrawOverlays(contexto)

  fun intentAjustesSuperposicion(contexto: Context): Intent =
    Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${contexto.packageName}"))
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)

  fun estaExentoDeBateria(contexto: Context): Boolean {
    val power = contexto.getSystemService(Context.POWER_SERVICE) as PowerManager
    return power.isIgnoringBatteryOptimizations(contexto.packageName)
  }

  fun intentExencionBateria(contexto: Context): Intent =
    Intent(
      Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
      Uri.parse("package:${contexto.packageName}"),
    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
}
