package expo.modules.trackernative

import android.Manifest
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.hardware.camera2.CameraManager
import android.util.Log
import kotlin.coroutines.cancellation.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull

/** Longest a photo may take, opening and metering included, before the capture goes without. */
private const val PHOTO_TIMEOUT_MS = 5_000L

/** High enough that the workspace's own quality, applied when composing, is what shows. */
private const val PHOTO_QUALITY = 92

internal class WebcamPhoto(val base64: String, val width: Int, val height: Int) {
  fun toMap() = mapOf("base64" to base64, "width" to width, "height" to height)
}

/**
 * `takeWebcamPhoto`: one upright front-camera frame, or null — never an error. A capture with no
 * photo is still a capture; JS uploads the plain screenshot and says why.
 *
 * "Upright" assumes the phone is held in its natural orientation: the app is portrait, and a
 * service has no activity whose rotation it could read.
 */
internal object WebcamCamera {
  suspend fun takePhoto(context: Context): WebcamPhoto? {
    if (!context.isGranted(Manifest.permission.CAMERA)) {
      return null
    }
    return try {
      val manager: CameraManager = context.service()
      val lens = FrontLens.find(manager)
      if (lens == null) {
        Log.e(LOG_TAG, "This phone has no usable front camera")
        return null
      }
      val jpeg = withTimeoutOrNull(PHOTO_TIMEOUT_MS) { CameraStill.capture(manager, lens) }
      if (jpeg == null) {
        Log.e(LOG_TAG, "The front camera took longer than $PHOTO_TIMEOUT_MS ms")
        return null
      }
      withContext(Dispatchers.Default) { upright(jpeg, lens.sensorOrientation) }
    } catch (e: CancellationException) {
      throw e
    } catch (e: Exception) {
      Log.e(LOG_TAG, "The webcam photo failed", e)
      null
    }
  }

  private fun upright(jpeg: ByteArray, rotation: Int): WebcamPhoto {
    val raw = BitmapFactory.decodeByteArray(jpeg, 0, jpeg.size) ?: throw ImageDecodeException("webcam photo")
    val photo = rotate(raw, rotation)
    val bytes = ImageCodec.encode(photo, ImageCodec.JPEG_MIME, PHOTO_QUALITY)
    return WebcamPhoto(ImageCodec.toBase64(bytes), photo.width, photo.height)
  }

  private fun rotate(bitmap: Bitmap, degrees: Int): Bitmap {
    if (degrees == 0) {
      return bitmap
    }
    val matrix = Matrix().apply { postRotate(degrees.toFloat()) }
    return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
  }
}
