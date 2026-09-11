package expo.modules.trackernative

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.util.Log
import androidx.core.app.ServiceCompat
import androidx.core.content.ContextCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/** The headless task JS registers (`KEEP_ALIVE_TASK` in src/native/tracker-native.ts). */
private const val KEEP_ALIVE_TASK = "ExyconnTrackerKeepAlive"

/** The task lives as long as the session; JS ends it by settling its promise. */
private const val NO_TIMEOUT = 0L

private const val ACTION_START = "expo.modules.trackernative.action.START_KEEP_ALIVE"
private const val ACTION_ATTACH_PROJECTION = "expo.modules.trackernative.action.ATTACH_PROJECTION"
private const val EXTRA_TITLE = "title"
private const val EXTRA_BODY = "body"
private const val EXTRA_CAMERA = "camera"

/**
 * The foreground service that keeps a session alive while the tracker is not on screen.
 *
 * It runs the headless task `ExyconnTrackerKeepAlive`, whose promise JS keeps pending for the
 * whole session: while a headless task runs, React Native keeps the JS thread and its timers
 * going with the app off screen — and those timers are the tracking loop. It is also the service
 * the screen-capture projection must belong to, and the one that holds the camera.
 *
 * START_NOT_STICKY throughout: a tracker the OS killed must not quietly come back and resume a
 * session JS no longer knows about.
 */
class KeepAliveService : HeadlessJsTaskService() {
  private var title: String? = null
  private var body = ""
  private var camera = false
  private var foreground = false
  private var taskStarted = false

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_START) {
      title = intent.getStringExtra(EXTRA_TITLE)
      body = intent.getStringExtra(EXTRA_BODY).orEmpty()
      camera = intent.getBooleanExtra(EXTRA_CAMERA, false)
    }
    val attaching = intent?.action == ACTION_ATTACH_PROJECTION
    if (!promote()) {
      if (attaching) {
        ScreenCaptureConsent.takeGrant()?.settle(false)
      }
      if (!foreground) {
        stopSelf()
      }
      return START_NOT_STICKY
    }
    foreground = true
    if (attaching) {
      attachProjection()
    }
    startKeepAliveTaskOnce()
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    ScreenCaptureSession.release()
    ScreenCaptureConsent.takeGrant()?.settle(false)
    super.onDestroy()
  }

  /**
   * (Re)enters the foreground with the types the session needs right now. Android 14 checks each
   * type's permission and eligibility here, so a refusal is logged and survived, not crashed on:
   * SecurityException for a missing grant, ForegroundServiceStartNotAllowedException (an
   * IllegalStateException) when Android 12+ will not allow a start from the background.
   */
  private fun promote(): Boolean =
    try {
      val notification = KeepAliveNotification.build(this, title ?: appLabel(), body)
      ServiceCompat.startForeground(this, KeepAliveNotification.ID, notification, foregroundTypes())
      true
    } catch (e: RuntimeException) {
      Log.e(LOG_TAG, "The tracking service could not run in the foreground", e)
      false
    }

  /** Android 14: startForeground as mediaProjection first, then the consent becomes a projection. */
  private fun attachProjection() {
    val grant = ScreenCaptureConsent.takeGrant() ?: return
    // onStartCommand runs on the main thread: a throw from the display or the ImageReader here
    // would close the app, so a failed start is a declined capture instead.
    val started = try {
      ScreenCaptureSession.start(this, grant.resultCode, grant.data)
    } catch (e: RuntimeException) {
      Log.e(LOG_TAG, "Screen capture could not start", e)
      ScreenCaptureSession.release()
      false
    }
    grant.settle(started)
  }

  private fun startKeepAliveTaskOnce() {
    if (taskStarted) {
      return
    }
    taskStarted = true
    startTask(HeadlessJsTaskConfig(KEEP_ALIVE_TASK, Arguments.createMap(), NO_TIMEOUT, true))
  }

  /** Each type only on the Android version that introduced it; ServiceCompat ignores types before 10. */
  private fun foregroundTypes(): Int {
    var types = 0
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && holdsCamera()) {
      types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_CAMERA
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && capturesScreen()) {
      types = types or ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
    }
    return types
  }

  /** Android 14 refuses the camera type without the CAMERA grant, so it is not asked for then. */
  private fun holdsCamera(): Boolean {
    if (!camera) {
      return false
    }
    if (isGranted(Manifest.permission.CAMERA)) {
      return true
    }
    Log.e(LOG_TAG, "Webcam capture was asked for without the CAMERA grant; running without the camera type")
    return false
  }

  private fun capturesScreen() = ScreenCaptureConsent.hasGrant() || ScreenCaptureSession.isLive

  private fun appLabel(): String = applicationInfo.loadLabel(packageManager).toString()

  companion object {
    fun start(context: Context, options: KeepAliveOptions) {
      val intent = Intent(context, KeepAliveService::class.java)
        .setAction(ACTION_START)
        .putExtra(EXTRA_TITLE, options.title)
        .putExtra(EXTRA_BODY, options.body)
        .putExtra(EXTRA_CAMERA, options.camera)
      ContextCompat.startForegroundService(context, intent)
    }

    /** Hands an accepted consent to the service, starting it if it is somehow not running. */
    internal fun attachProjection(context: Context) {
      val intent = Intent(context, KeepAliveService::class.java).setAction(ACTION_ATTACH_PROJECTION)
      ContextCompat.startForegroundService(context, intent)
    }

    fun stop(context: Context) {
      ScreenCaptureSession.release()
      context.stopService(Intent(context, KeepAliveService::class.java))
    }
  }
}
