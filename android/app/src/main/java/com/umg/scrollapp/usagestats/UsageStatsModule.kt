package com.umg.scrollapp.usagestats

import android.app.ActivityManager
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.os.Build
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.bridge.WritableArray
import com.umg.scrollapp.specs.NativeUsageStatsSpec
import java.util.concurrent.Executors

/**
 * TurboModule `UsageStats`: expone a React Native los permisos especiales, la consulta de
 * uso por paquete y el control del servicio de monitoreo. El contrato TypeScript está en
 * `src/native/specs/NativeUsageStats.ts` (codegen genera `NativeUsageStatsSpec`).
 */
class UsageStatsModule(private val contexto: ReactApplicationContext) :
  NativeUsageStatsSpec(contexto), DetectorBus.Oyente {

  private val ejecutor = Executors.newSingleThreadExecutor()

  init {
    DetectorBus.registrar(this)
  }

  override fun getName(): String = NAME

  override fun invalidate() {
    DetectorBus.registrar(null)
    ejecutor.shutdown()
    super.invalidate()
  }

  // ------------------------------------------------------------------ dispositivo

  override fun obtenerInfoDispositivo(promise: Promise) {
    try {
      val activityManager = contexto.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      val memoria = ActivityManager.MemoryInfo().also { activityManager.getMemoryInfo(it) }
      promise.resolve(
        Arguments.createMap().apply {
          putString("modelo", Build.MODEL ?: "")
          putString("fabricante", Build.MANUFACTURER ?: "")
          putDouble("ramMb", memoria.totalMem / (1024.0 * 1024.0))
          putInt("versionAndroid", Build.VERSION.SDK_INT)
        },
      )
    } catch (e: Exception) {
      promise.reject("ERROR_DISPOSITIVO", e.message, e)
    }
  }

  override fun obtenerAppsInstaladas(paquetes: ReadableArray, promise: Promise) {
    val lista = (0 until paquetes.size()).mapNotNull { paquetes.getString(it) }
    ejecutor.execute {
      try {
        val packageManager = contexto.packageManager
        val resultado: WritableArray = Arguments.createArray()
        for (paquete in lista) {
          val info = try {
            packageManager.getApplicationInfo(paquete, 0)
          } catch (e: PackageManager.NameNotFoundException) {
            continue
          }
          resultado.pushMap(
            Arguments.createMap().apply {
              putString("paquete", paquete)
              putString("nombre", packageManager.getApplicationLabel(info).toString())
              putString("iconoBase64", iconoEnBase64(packageManager.getApplicationIcon(info)))
            },
          )
        }
        promise.resolve(resultado)
      } catch (e: Exception) {
        promise.reject("ERROR_APPS", e.message, e)
      }
    }
  }

  /** Dibuja el icono (también los adaptativos) en un bitmap de 96 px y lo codifica como PNG base64. */
  private fun iconoEnBase64(icono: Drawable): String {
    val tamano = 96
    val bitmap = Bitmap.createBitmap(tamano, tamano, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    icono.setBounds(0, 0, tamano, tamano)
    icono.draw(canvas)
    val salida = ByteArrayOutputStream()
    bitmap.compress(Bitmap.CompressFormat.PNG, 100, salida)
    bitmap.recycle()
    return Base64.encodeToString(salida.toByteArray(), Base64.NO_WRAP)
  }

  // ------------------------------------------------------------------ permisos

  override fun tienePermisoUso(): Boolean = Permisos.tienePermisoUso(contexto)

  override fun abrirAjustesPermisoUso() = abrir(Permisos.intentAjustesUso(contexto))

  override fun tienePermisoSuperposicion(): Boolean = Permisos.tienePermisoSuperposicion(contexto)

  override fun abrirAjustesSuperposicion() = abrir(Permisos.intentAjustesSuperposicion(contexto))

  override fun estaExentoDeBateria(): Boolean = Permisos.estaExentoDeBateria(contexto)

  override fun solicitarExencionBateria() = abrir(Permisos.intentExencionBateria(contexto))

  // ------------------------------------------------------------------ uso

  override fun obtenerUso(inicioMs: Double, finMs: Double, paquetes: ReadableArray, promise: Promise) {
    if (!Permisos.tienePermisoUso(contexto)) {
      promise.reject("SIN_PERMISO", "No se ha concedido el acceso a datos de uso")
      return
    }
    val lista = (0 until paquetes.size()).mapNotNull { paquetes.getString(it) }.toSet()
    ejecutor.execute {
      try {
        val usageStats = contexto.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val resultado: WritableArray = Arguments.createArray()
        CalculadorUso.calcular(usageStats, inicioMs.toLong(), finMs.toLong(), lista).forEach { uso ->
          resultado.pushMap(
            Arguments.createMap().apply {
              putString("paquete", uso.paquete)
              putDouble("minutosEnPrimerPlano", uso.milisegundosEnPrimerPlano / 60_000.0)
              putInt("aperturas", uso.aperturas)
            },
          )
        }
        promise.resolve(resultado)
      } catch (e: Exception) {
        promise.reject("ERROR_USO", e.message, e)
      }
    }
  }

  override fun obtenerAppEnPrimerPlano(promise: Promise) {
    if (!Permisos.tienePermisoUso(contexto)) {
      promise.resolve(null)
      return
    }
    ejecutor.execute {
      try {
        val usageStats = contexto.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val ahora = System.currentTimeMillis()
        promise.resolve(CalculadorUso.ultimoEnPrimerPlano(usageStats, ahora - 60_000L, ahora))
      } catch (e: Exception) {
        promise.reject("ERROR_USO", e.message, e)
      }
    }
  }

  // ------------------------------------------------------------------ monitoreo

  override fun iniciarMonitoreo(paquetes: ReadableArray) {
    val lista = (0 until paquetes.size()).mapNotNull { paquetes.getString(it) }
    MonitoreoService.iniciar(contexto, lista)
  }

  override fun detenerMonitoreo() = MonitoreoService.detener(contexto)

  override fun estaMonitoreando(): Boolean = MonitoreoService.activo

  override fun obtenerFriccionPendiente(): String? = DetectorBus.tomarFriccionPendiente()

  override fun informarDecision(paquete: String, decision: String) {
    MonitoreoService.instancia?.informarDecision(paquete, decision)
  }

  override fun volverAAppAnterior() {
    UiThreadUtil.runOnUiThread {
      val actividad = contexto.currentActivity
      if (actividad == null || !actividad.moveTaskToBack(true)) {
        Log.w(TAG, "No se pudo enviar la app al fondo")
      }
    }
  }

  // ------------------------------------------------------------------ eventos

  override fun addListener(eventName: String) {
    // Requerido por NativeEventEmitter; la suscripción real la gestiona JavaScript.
  }

  override fun removeListeners(count: Double) {
    // Requerido por NativeEventEmitter.
  }

  override fun alDetectarApertura(paquete: String, redSocial: String) {
    if (!contexto.hasActiveReactInstance()) return
    val datos = Arguments.createMap().apply {
      putString("paquete", paquete)
      putString("redSocial", redSocial)
    }
    contexto.emitDeviceEvent(EVENTO_APERTURA, datos)
  }

  private fun abrir(intent: Intent) {
    try {
      (contexto.currentActivity ?: contexto).startActivity(intent)
    } catch (e: Exception) {
      Log.w(TAG, "No se pudo abrir la pantalla de ajustes", e)
    }
  }

  companion object {
    const val NAME = "UsageStats"
    const val EVENTO_APERTURA = "aperturaDetectada"
    private const val TAG = "ScrollApp/UsageStats"
  }
}
