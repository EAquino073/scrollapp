package com.umg.scrollapp.notificaciones

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import com.umg.scrollapp.MainActivity
import com.umg.scrollapp.R

/**
 * Notificaciones locales de ScrollApp (check-in nocturno y revisión semanal).
 * No se guardan en Firestore ni salen del dispositivo: son recordatorios del sistema.
 */
object Notificaciones {
  const val CANAL_RECORDATORIOS = "recordatorios"
  const val ID_CHECKIN = 2001
  const val ID_REVISION = 2002

  /** Destino dentro de la app al tocar la notificación (lo lee JavaScript). */
  const val EXTRA_DESTINO = "destino_notificacion"
  const val DESTINO_CHECKIN = "CheckIn"
  const val DESTINO_REVISION = "RevisionSemanal"

  fun crearCanal(contexto: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val canal = NotificationChannel(
      CANAL_RECORDATORIOS,
      contexto.getString(R.string.canal_recordatorios_nombre),
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
      description = contexto.getString(R.string.canal_recordatorios_descripcion)
    }
    gestor(contexto).createNotificationChannel(canal)
  }

  fun mostrar(contexto: Context, id: Int, titulo: String, texto: String, destino: String) {
    crearCanal(contexto)
    val intent = Intent(contexto, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra(EXTRA_DESTINO, destino)
    }
    val pendiente = PendingIntent.getActivity(
      contexto,
      id,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(contexto, CANAL_RECORDATORIOS)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(contexto)
    }
    val notificacion = builder
      .setSmallIcon(R.drawable.ic_notificacion)
      .setContentTitle(titulo)
      .setContentText(texto)
      .setStyle(Notification.BigTextStyle().bigText(texto))
      .setContentIntent(pendiente)
      .setAutoCancel(true)
      .build()
    try {
      gestor(contexto).notify(id, notificacion)
    } catch (e: SecurityException) {
      // Android 13+ sin permiso de notificaciones: no es un fallo de la app.
      Log.i(TAG, "Sin permiso de notificaciones; no se muestra el recordatorio")
    }
  }

  fun cancelar(contexto: Context, id: Int) = gestor(contexto).cancel(id)

  private fun gestor(contexto: Context) =
    contexto.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private const val TAG = "ScrollApp/Notif"
}
