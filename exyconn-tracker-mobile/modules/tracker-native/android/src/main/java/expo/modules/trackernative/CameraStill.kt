package expo.modules.trackernative

import android.annotation.SuppressLint
import android.graphics.ImageFormat
import android.hardware.camera2.CameraCaptureSession
import android.hardware.camera2.CameraDevice
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.hardware.camera2.CaptureFailure
import android.hardware.camera2.CaptureRequest
import android.hardware.camera2.CaptureResult
import android.hardware.camera2.TotalCaptureResult
import android.media.Image
import android.media.ImageReader
import android.os.Handler
import android.os.HandlerThread
import java.util.concurrent.atomic.AtomicReference
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.CancellableContinuation
import kotlinx.coroutines.suspendCancellableCoroutine

/** Frames to meter before trusting auto-exposure, and the most to wait for it. */
private const val MIN_METER_FRAMES = 3
private const val MAX_METER_FRAMES = 30

/** The still is re-encoded once it is turned upright; this only has to survive that. */
private const val STILL_JPEG_QUALITY: Byte = 95

private val SETTLED_AE_STATES = setOf(
  CameraMetadata.CONTROL_AE_STATE_CONVERGED,
  CameraMetadata.CONTROL_AE_STATE_FLASH_REQUIRED,
  CameraMetadata.CONTROL_AE_STATE_LOCKED,
)

private class CameraFailure(message: String) : IllegalStateException(message)

/**
 * The camera's thread and the two streams it writes to: a throwaway metering stream and the
 * still. Released on that thread once the camera has closed, so no frame callback can race it.
 */
private class Rig(lens: FrontLens) {
  val thread = HandlerThread("TrackerWebcam").apply { start() }
  val handler = Handler(thread.looper)
  val still: ImageReader = ImageReader.newInstance(lens.stillSize.width, lens.stillSize.height, ImageFormat.JPEG, 1)
  val meter: ImageReader =
    ImageReader.newInstance(lens.meterSize.width, lens.meterSize.height, ImageFormat.YUV_420_888, 2).apply {
      setOnImageAvailableListener({ reader -> reader.acquireLatestImage()?.close() }, handler)
    }

  fun release() {
    meter.close()
    still.close()
    thread.quitSafely()
  }
}

/**
 * One JPEG from the front camera, with the camera open for as short a time as a good picture
 * allows — the phone's version of the desktop's promise that the camera light goes on and
 * straight back off.
 *
 * A camera that has just woken up hands over dark frames until it has metered the scene, so a
 * short preview runs into the throwaway stream until auto-exposure settles; then the still is
 * taken and the camera is closed, whatever happened — including a timeout that fires while the
 * camera is still opening, in which case it is closed the moment it opens.
 */
internal object CameraStill {
  suspend fun capture(manager: CameraManager, lens: FrontLens): ByteArray {
    val rig = Rig(lens)
    val opened = AtomicReference<CameraDevice?>()
    try {
      val camera = open(manager, lens.id, rig, opened)
      val session = configure(camera, rig)
      meterExposure(camera, session, rig)
      return shoot(camera, session, rig)
    } finally {
      // Closing ends every session; onClosed then releases the rig.
      opened.get()?.close()
    }
  }

  @SuppressLint("MissingPermission") // WebcamCamera checks CAMERA before any lens is touched.
  private suspend fun open(
    manager: CameraManager,
    id: String,
    rig: Rig,
    opened: AtomicReference<CameraDevice?>,
  ): CameraDevice = suspendCancellableCoroutine { continuation ->
    val callback = object : CameraDevice.StateCallback() {
      override fun onOpened(camera: CameraDevice) {
        opened.set(camera)
        if (continuation.isActive) {
          continuation.resume(camera)
        } else {
          camera.close()
        }
      }

      override fun onDisconnected(camera: CameraDevice) {
        camera.close()
        continuation.failIfActive("The front camera was taken by another app")
      }

      override fun onError(camera: CameraDevice, error: Int) {
        camera.close()
        continuation.failIfActive("The front camera failed (error $error)")
      }

      override fun onClosed(camera: CameraDevice) {
        rig.release()
      }
    }
    try {
      manager.openCamera(id, callback, rig.handler)
    } catch (e: Exception) {
      // No callback will ever come, so nothing else would release the rig.
      rig.handler.post(rig::release)
      throw e
    }
  }

  @Suppress("DEPRECATION") // SessionConfiguration needs Android 9; this app supports Android 8.
  private suspend fun configure(camera: CameraDevice, rig: Rig): CameraCaptureSession =
    suspendCancellableCoroutine { continuation ->
      val callback = object : CameraCaptureSession.StateCallback() {
        override fun onConfigured(session: CameraCaptureSession) {
          if (continuation.isActive) {
            continuation.resume(session)
          }
        }

        override fun onConfigureFailed(session: CameraCaptureSession) {
          continuation.failIfActive("The front camera could not be configured")
        }
      }
      camera.createCaptureSession(listOf(rig.meter.surface, rig.still.surface), callback, rig.handler)
    }

  private suspend fun meterExposure(camera: CameraDevice, session: CameraCaptureSession, rig: Rig): Unit =
    suspendCancellableCoroutine { continuation ->
      val preview = camera.createCaptureRequest(CameraDevice.TEMPLATE_PREVIEW).apply { addTarget(rig.meter.surface) }
      var frames = 0
      val callback = object : CameraCaptureSession.CaptureCallback() {
        override fun onCaptureCompleted(
          session: CameraCaptureSession,
          request: CaptureRequest,
          result: TotalCaptureResult,
        ) {
          frames += 1
          if (continuation.isActive && isMetered(result, frames)) {
            continuation.resume(Unit)
          }
        }
      }
      session.setRepeatingRequest(preview.build(), callback, rig.handler)
    }

  /**
   * JPEG_ORIENTATION stays 0: a camera may honour it by rotating the pixels or by only writing
   * an EXIF tag, which BitmapFactory ignores. WebcamCamera turns the pixels itself, so the photo
   * is upright on every device and its size is the size JS places.
   */
  private suspend fun shoot(camera: CameraDevice, session: CameraCaptureSession, rig: Rig): ByteArray =
    suspendCancellableCoroutine { continuation ->
      rig.still.setOnImageAvailableListener({ reader ->
        // The camera's own handler thread: a throw here would bypass the coroutine and kill the
        // process, so it fails the photo instead.
        try {
          val bytes = reader.acquireNextImage()?.use(::jpegBytes)
          if (bytes != null && continuation.isActive) {
            continuation.resume(bytes)
          }
        } catch (e: RuntimeException) {
          continuation.failIfActive("The front camera photo could not be read (${e.message})")
        }
      }, rig.handler)
      val request = camera.createCaptureRequest(CameraDevice.TEMPLATE_STILL_CAPTURE).apply {
        addTarget(rig.still.surface)
        set(CaptureRequest.JPEG_ORIENTATION, 0)
        set(CaptureRequest.JPEG_QUALITY, STILL_JPEG_QUALITY)
      }
      val callback = object : CameraCaptureSession.CaptureCallback() {
        override fun onCaptureFailed(session: CameraCaptureSession, request: CaptureRequest, failure: CaptureFailure) {
          continuation.failIfActive("The front camera could not take the photo (reason ${failure.reason})")
        }
      }
      session.capture(request.build(), callback, rig.handler)
    }

  /** Settled once auto-exposure says so; a LEGACY camera that reports no state gets a few frames. */
  private fun isMetered(result: CaptureResult, frames: Int): Boolean {
    if (frames >= MAX_METER_FRAMES) {
      return true
    }
    if (frames < MIN_METER_FRAMES) {
      return false
    }
    val state = result.get(CaptureResult.CONTROL_AE_STATE) ?: return true
    return state in SETTLED_AE_STATES
  }

  private fun jpegBytes(image: Image): ByteArray {
    val buffer = image.planes[0].buffer
    return ByteArray(buffer.remaining()).also { buffer.get(it) }
  }

  private fun <T> CancellableContinuation<T>.failIfActive(message: String) {
    if (isActive) {
      resumeWithException(CameraFailure(message))
    }
  }
}
