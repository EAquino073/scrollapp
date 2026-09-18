package com.umg.scrollapp.usagestats

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ServiceInfo
import android.graphics.Color
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.util.Log
import android.view.View
import android.view.WindowManager
import com.umg.scrollapp.MainActivity
import com.umg.scrollapp.R

/**
 * Servicio en primer plano que consulta `UsageStatsManager.queryEvents` de forma periódica
 * (solo con la pantalla encendida) y detecta cuándo una red social monitoreada pasa a
 * primer plano. Al detectarla: avisa a JavaScript, guarda la fricción pendiente y lanza
 * `MainActivity` con los datos para mostrar la pantalla de fricción.
 *
 * Limitaciones conocidas: ver CLAUDE.md, sección "Monitoreo nativo".
 */
class MonitoreoService : Service() {

  private lateinit var hilo: HandlerThread
  private lateinit var handler: Handler
  private val handlerPrincipal = Handler(Looper.getMainLooper())
  private lateinit var preferencias: Preferencias
  private val estado = EstadoDeteccion()
  private var ultimoProcesado = 0L

  @Volatile
  private var pantallaEncendida = true

  private val receptorPantalla = object : BroadcastReceiver() {
    override fun onReceive(contexto: Context, intent: Intent) {
      when (intent.action) {
        Intent.ACTION_SCREEN_OFF -> {
          pantallaEncendida = false
          handler.removeCallbacks(tarea)
        }
        Intent.ACTION_SCREEN_ON, Intent.ACTION_USER_PRESENT -> {
          pantallaEncendida = true
          ultimoProcesado = System.currentTimeMillis()
          programar()
        }
      }
    }
  }

  private val tarea = object : Runnable {
    override fun run() {
      try {
        revisarEventos()
      } catch (e: Exception) {
        Log.w(TAG, "Error al revisar eventos de uso", e)
      }
      programar()
    }
  }

  override fun onCreate() {
    super.onCreate()
    preferencias = Preferencias(this)
    crearCanal()
    iniciarEnPrimerPlano()
    hilo = HandlerThread("scrollapp-monitoreo").also { it.start() }
    handler = Handler(hilo.looper)
    registerReceiver(
      receptorPantalla,
      IntentFilter().apply {
        addAction(Intent.ACTION_SCREEN_OFF)
        addAction(Intent.ACTION_SCREEN_ON)
        addAction(Intent.ACTION_USER_PRESENT)
      },
    )
    instancia = this
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACCION_DETENER) {
      stopSelf()
      return START_NOT_STICKY
    }
    val paquetes = intent?.getStringArrayListExtra(EXTRA_PAQUETES)?.toSet()
      ?: preferencias.paquetesMonitoreados
    estado.paquetesMonitoreados = paquetes
    preferencias.paquetesMonitoreados = paquetes
    preferencias.monitoreoActivo = true
    activo = true
    ultimoProcesado = System.currentTimeMillis()
    programar()
    Log.i(TAG, "Monitoreo iniciado para ${paquetes.size} paquetes")
    return START_STICKY
  }

  override fun onDestroy() {
    activo = false
    instancia = null
    handler.removeCallbacks(tarea)
    runCatching { unregisterReceiver(receptorPantalla) }
    hilo.quitSafely()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  /** Registra la decisión tomada en la pantalla de fricción para no repetirla en la misma sesión. */
  fun informarDecision(paquete: String, decision: String) {
    estado.alDecidir(paquete, decision)
  }

  // ---------------------------------------------------------------------------------
  // Detección
  // ---------------------------------------------------------------------------------

  private fun programar() {
    handler.removeCallbacks(tarea)
    if (pantallaEncendida && activo) {
      handler.postDelayed(tarea, INTERVALO_MS)
    }
  }

  private fun revisarEventos() {
    val usageStats = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val ahora = System.currentTimeMillis()
    // Pequeño solape para no perder eventos registrados con retraso; se deduplican por marca de tiempo.
    val eventos = usageStats.queryEvents(ultimoProcesado - SOLAPE_MS, ahora)
    val evento = UsageEvents.Event()
    var maximo = ultimoProcesado

    while (eventos.hasNextEvent()) {
      eventos.getNextEvent(evento)
      val ts = evento.timeStamp
      if (ts <= ultimoProcesado) continue
      if (ts > maximo) maximo = ts
      val paquete = evento.packageName ?: continue
      if (paquete == packageName) continue

      when (evento.eventType) {
        CalculadorUso.EVENTO_PRIMER_PLANO -> {
          when (estado.alPasarAPrimerPlano(paquete, ts)) {
            EstadoDeteccion.Accion.DISPARAR -> disparar(paquete)
            EstadoDeteccion.Accion.REFORZAR -> reforzar(paquete)
            EstadoDeteccion.Accion.NADA -> Unit
          }
        }
        CalculadorUso.EVENTO_PAUSA, CalculadorUso.EVENTO_DETENIDA -> {
          estado.alPasarASegundoPlano(paquete, ts)
        }
      }
    }
    ultimoProcesado = maximo
  }

  private fun disparar(paquete: String) {
    val redSocial = RedesSociales.nombreDe(paquete)
    Log.i(TAG, "Apertura detectada: $redSocial ($paquete)")
    DetectorBus.publicarApertura(paquete, redSocial)
    handlerPrincipal.post {
      mostrarVeloBreve()
      lanzarPantallaFriccion(paquete, redSocial)
    }
  }

  /**
   * La red social volvió al frente pocos segundos después de lanzar la pausa y aún no hay
   * decisión (p. ej. un diálogo del sistema se puso encima): se vuelve a traer la pantalla
   * de fricción sin generar un evento nuevo.
   */
  private fun reforzar(paquete: String) {
    val redSocial = RedesSociales.nombreDe(paquete)
    Log.i(TAG, "Reforzando la pausa para $redSocial")
    DetectorBus.guardarFriccionPendiente(paquete)
    handlerPrincipal.post {
      mostrarVeloBreve()
      lanzarPantallaFriccion(paquete, redSocial)
    }
  }

  /**
   * Velo translúcido de unos segundos sobre la red social. Además de suavizar la
   * transición, tener una ventana visible es una de las condiciones que Android 14+
   * exige a las apps con SYSTEM_ALERT_WINDOW para poder abrir una actividad desde
   * segundo plano.
   */
  private fun mostrarVeloBreve() {
    if (!Permisos.tienePermisoSuperposicion(this)) return
    val windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val velo = View(this).apply { setBackgroundColor(Color.argb(140, 251, 247, 242)) }
    val parametros = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
        WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    )
    try {
      windowManager.addView(velo, parametros)
      handlerPrincipal.postDelayed({ runCatching { windowManager.removeView(velo) } }, DURACION_VELO_MS)
    } catch (e: Exception) {
      Log.w(TAG, "No se pudo mostrar el velo", e)
    }
  }

  private fun lanzarPantallaFriccion(paquete: String, redSocial: String) {
    val intent = Intent(this, MainActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
      putExtra(MainActivity.EXTRA_FRICCION_PAQUETE, paquete)
      putExtra(MainActivity.EXTRA_FRICCION_RED, redSocial)
    }
    try {
      startActivity(intent)
    } catch (e: Exception) {
      Log.w(TAG, "No se pudo abrir la pantalla de fricción; queda pendiente", e)
    }
  }

  // ---------------------------------------------------------------------------------
  // Notificación persistente
  // ---------------------------------------------------------------------------------

  private fun crearCanal() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val canal = NotificationChannel(
      CANAL_ID,
      getString(R.string.canal_monitoreo_nombre),
      NotificationManager.IMPORTANCE_MIN,
    ).apply {
      description = getString(R.string.canal_monitoreo_descripcion)
      setShowBadge(false)
    }
    (getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).createNotificationChannel(canal)
  }

  private fun construirNotificacion(): Notification {
    val abrirApp = PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CANAL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this).setPriority(Notification.PRIORITY_MIN)
    }
    return builder
      .setSmallIcon(R.drawable.ic_notificacion)
      .setContentTitle(getString(R.string.notificacion_monitoreo_titulo))
      .setContentText(getString(R.string.notificacion_monitoreo_texto))
      .setContentIntent(abrirApp)
      .setOngoing(true)
      .setVisibility(Notification.VISIBILITY_SECRET)
      .build()
  }

  private fun iniciarEnPrimerPlano() {
    val notificacion = construirNotificacion()
    when {
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE ->
        startForeground(ID_NOTIFICACION, notificacion, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ->
        startForeground(ID_NOTIFICACION, notificacion, ServiceInfo.FOREGROUND_SERVICE_TYPE_MANIFEST)
      else -> startForeground(ID_NOTIFICACION, notificacion)
    }
  }

  companion object {
    private const val TAG = "ScrollApp/Monitoreo"
    const val ACCION_INICIAR = "com.umg.scrollapp.MONITOREO_INICIAR"
    const val ACCION_DETENER = "com.umg.scrollapp.MONITOREO_DETENER"
    const val EXTRA_PAQUETES = "paquetes"
    private const val CANAL_ID = "acompanamiento"
    private const val ID_NOTIFICACION = 1001
    private const val INTERVALO_MS = 1_000L
    private const val SOLAPE_MS = 2_000L
    private const val DURACION_VELO_MS = 2_500L

    @Volatile
    var activo = false
      private set

    @Volatile
    var instancia: MonitoreoService? = null
      private set

    fun iniciar(contexto: Context, paquetes: Collection<String>) {
      val intent = Intent(contexto, MonitoreoService::class.java).apply {
        action = ACCION_INICIAR
        putStringArrayListExtra(EXTRA_PAQUETES, ArrayList(paquetes))
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        contexto.startForegroundService(intent)
      } else {
        contexto.startService(intent)
      }
    }

    fun detener(contexto: Context) {
      Preferencias(contexto).monitoreoActivo = false
      contexto.stopService(Intent(contexto, MonitoreoService::class.java))
    }
  }
}
