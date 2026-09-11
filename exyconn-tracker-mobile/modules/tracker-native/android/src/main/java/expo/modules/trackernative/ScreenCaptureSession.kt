package expo.modules.trackernative

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Handler
import android.os.HandlerThread
import android.util.DisplayMetrics
import android.util.Log
import android.view.Display

private const val DISPLAY_NAME = "ExyconnTrackerCapture"

/** One frame held for captureScreen plus one arriving — all acquireLatestImage needs. */
private const val MAX_IMAGES = 2

/**
 * The one live screen-capture session: the projection the employee consented to, the single
 * virtual display mirroring the screen into an ImageReader, and the newest frame it produced.
 *
 * A mirrored display only produces a frame when the screen changes, so the newest frame is kept
 * rather than waited for: on a still screen it is the screen. Android 14 allows one virtual
 * display per projection, which is why the session is created once and read many times.
 *
 * Touched from the JS thread, the service's main thread and the capture thread, so all state is
 * under [lock].
 */
internal object ScreenCaptureSession {
  private class Live(
    val projection: MediaProjection,
    val callback: MediaProjection.Callback,
    val reader: ImageReader,
    val display: VirtualDisplay,
    val thread: HandlerThread,
  )

  private val lock = Any()
  private var live: Live? = null

  /** The reader frames are accepted from — set before the display exists, so none is dropped. */
  private var acceptedReader: ImageReader? = null
  private var latestImage: Image? = null

  /** Told when the employee (the "Stop sharing" chip) or the OS ends the session — not JS. */
  @Volatile
  var onEndedByUser: (() -> Unit)? = null

  val isLive: Boolean
    get() = synchronized(lock) { live != null }

  /**
   * Turns an accepted consent into a live session. The caller must already be a foreground
   * service of type mediaProjection (Android 14 throws otherwise).
   */
  fun start(context: Context, resultCode: Int, data: Intent): Boolean {
    release()
    val metrics = realMetrics(context)
    val projection = obtainProjection(context, resultCode, data) ?: return false
    val thread = HandlerThread(DISPLAY_NAME).apply { start() }
    val handler = Handler(thread.looper)
    val reader = ImageReader.newInstance(metrics.widthPixels, metrics.heightPixels, PixelFormat.RGBA_8888, MAX_IMAGES)
    reader.setOnImageAvailableListener(::keepLatest, handler)
    synchronized(lock) { acceptedReader = reader }

    val callback = endCallback()
    val display = mirror(projection, callback, reader, metrics, handler)
    if (display == null) {
      synchronized(lock) { acceptedReader = null }
      projection.stop()
      reader.close()
      thread.quitSafely()
      return false
    }
    synchronized(lock) { live = Live(projection, callback, reader, display, thread) }
    return true
  }

  /** A copy of the newest frame, cropped to the screen. Null before the first frame arrives. */
  fun latestFrame(): Bitmap? = synchronized(lock) { latestImage?.let(ScreenFrame::toBitmap) }

  /** Ends the session without telling JS — JS asked for it, or the service is going away. */
  fun release() {
    val ended = synchronized(lock) {
      latestImage?.close()
      latestImage = null
      acceptedReader = null
      live.also { live = null }
    } ?: return
    ended.projection.unregisterCallback(ended.callback)
    ended.display.release()
    ended.projection.stop()
    ended.reader.close()
    ended.thread.quitSafely()
  }

  /**
   * SecurityException when the service is not yet a mediaProjection service or the consent was
   * already used (Android 14 allows each once); IllegalStateException for a spent token.
   */
  private fun obtainProjection(context: Context, resultCode: Int, data: Intent): MediaProjection? =
    try {
      context.service<MediaProjectionManager>().getMediaProjection(resultCode, data)
    } catch (e: RuntimeException) {
      Log.e(LOG_TAG, "The screen-capture consent could not become a projection", e)
      null
    }

  /** Registers the stop callback BEFORE the display, as Android 14 requires. */
  private fun mirror(
    projection: MediaProjection,
    callback: MediaProjection.Callback,
    reader: ImageReader,
    metrics: DisplayMetrics,
    handler: Handler,
  ): VirtualDisplay? =
    try {
      projection.registerCallback(callback, handler)
      projection.createVirtualDisplay(
        DISPLAY_NAME,
        metrics.widthPixels,
        metrics.heightPixels,
        metrics.densityDpi,
        DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
        reader.surface,
        null,
        handler,
      )
    } catch (e: RuntimeException) {
      Log.e(LOG_TAG, "The screen could not be mirrored for capture", e)
      null
    }

  /** Keeps only the newest frame, closing the one it replaces so the reader never runs dry. */
  private fun keepLatest(reader: ImageReader) {
    val image = try {
      reader.acquireLatestImage()
    } catch (e: IllegalStateException) {
      // The session was released while this frame was on its way.
      Log.e(LOG_TAG, "A screen frame arrived after capture ended", e)
      null
    } ?: return
    synchronized(lock) {
      if (acceptedReader !== reader) {
        image.close()
        return
      }
      latestImage?.close()
      latestImage = image
    }
  }

  private fun endCallback() = object : MediaProjection.Callback() {
    override fun onStop() {
      val ours = synchronized(lock) { live?.callback === this }
      if (!ours) {
        return
      }
      release()
      onEndedByUser?.invoke()
    }
  }

  /** The panel's real size, system bars included — what "native resolution" means in JS. */
  @Suppress("DEPRECATION") // getRealMetrics: the non-deprecated WindowMetrics needs a UI context.
  private fun realMetrics(context: Context): DisplayMetrics {
    val display = requireNotNull(context.service<DisplayManager>().getDisplay(Display.DEFAULT_DISPLAY)) {
      "There is no default display to capture"
    }
    return DisplayMetrics().also { display.getRealMetrics(it) }
  }
}
