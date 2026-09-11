package expo.modules.trackernative

import android.content.Context
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

/** The logcat tag every class in this module writes under. */
internal const val LOG_TAG = "TrackerNative"

private const val CAPTURE_STOPPED_EVENT = "onScreenCaptureStopped"

/**
 * `TrackerNative` — exactly the contract in `src/native/tracker-native.ts`, and nothing else.
 *
 * Every function hands straight to the class that owns that one job, so this file reads as the
 * module's table of contents. Anything heavy (bitmaps, the camera) leaves both the JS thread and
 * Expo's shared async queue, which every other module's async calls also wait on.
 */
class TrackerNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()

  private val deviceUse by lazy { DeviceUseMonitor(context) }
  private val foregroundApps by lazy { ForegroundAppReader(context) }

  override fun definition() = ModuleDefinition {
    Name("TrackerNative")
    Events(CAPTURE_STOPPED_EVENT)

    OnCreate {
      deviceUse.start()
      ScreenCaptureSession.onEndedByUser = { sendEvent(CAPTURE_STOPPED_EVENT) }
    }
    OnDestroy {
      deviceUse.stop()
      ScreenCaptureSession.onEndedByUser = null
    }

    Function("getIdleSeconds") { deviceUse.idleSeconds() }
    Function("hasUsageAccess") { UsageAccess.isGranted(context) }
    Function("openUsageAccessSettings") { UsageAccess.openSettings(context) }
    Function("getForegroundApp") { foregroundApps.current()?.toMap() }

    // The consent dialog is an activity, so it is launched from the main thread.
    AsyncFunction("requestScreenCapture") { promise: Promise ->
      ScreenCaptureConsent.request(appContext.currentActivity) { live -> promise.resolve(live) }
    }.runOnQueue(Queues.MAIN)
    OnActivityResult { _, result ->
      ScreenCaptureConsent.onActivityResult(context, result.requestCode, result.resultCode, result.data)
    }
    Function("hasScreenCapture") { ScreenCaptureSession.isLive }
    Function("releaseScreenCapture") { ScreenCaptureSession.release() }
    AsyncFunction("captureScreen") Coroutine { options: CaptureOptions ->
      withContext(Dispatchers.Default) {
        ScreenCaptureSession.latestFrame()?.let { frame -> CaptureEncoder.encode(frame, options).toMap() }
      }
    }

    AsyncFunction("takeWebcamPhoto") Coroutine { -> WebcamCamera.takePhoto(context)?.toMap() }
    AsyncFunction("composeWebcam") Coroutine { input: ComposeInput ->
      withContext(Dispatchers.Default) { WebcamCompositor.compose(input) }
    }

    AsyncFunction("startKeepAlive") { options: KeepAliveOptions -> KeepAliveService.start(context, options) }
    AsyncFunction("stopKeepAlive") { KeepAliveService.stop(context) }

    Function("showCaptureNotification") { options: CaptureNotificationOptions -> postCaptureNotification(options) }
  }

  /** Decoding and scaling a full screenshot is too slow for the JS thread; JS does not wait. */
  private fun postCaptureNotification(options: CaptureNotificationOptions) {
    val context = context
    appContext.backgroundCoroutineScope.launch { CaptureNotifier.show(context, options) }
  }
}
