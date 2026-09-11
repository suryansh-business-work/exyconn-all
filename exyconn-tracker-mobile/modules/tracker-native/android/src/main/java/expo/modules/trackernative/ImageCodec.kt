package expo.modules.trackernative

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Base64
import expo.modules.kotlin.exception.CodedException
import java.io.ByteArrayOutputStream
import kotlin.math.max
import kotlin.math.roundToInt

/** The image data JS sent could not be read. Code: ERR_IMAGE_DECODE. */
class ImageDecodeException(what: String, cause: Throwable? = null) :
  CodedException("The $what could not be decoded.", cause)

/**
 * Base64, decoding, encoding and scaling — the pieces the capture, the webcam, the compositor
 * and the notification all share. Only the two encodings the quality dial produces exist here:
 * PNG (lossless) and JPEG.
 */
internal object ImageCodec {
  const val PNG_MIME = "image/png"
  const val JPEG_MIME = "image/jpeg"

  /** The top of the quality scale. PNG ignores it; for JPEG it is the fallback's "best". */
  const val BEST_QUALITY = 100

  fun encode(bitmap: Bitmap, mimeType: String, quality: Int): ByteArray {
    val format = if (mimeType == PNG_MIME) Bitmap.CompressFormat.PNG else Bitmap.CompressFormat.JPEG
    val out = ByteArrayOutputStream()
    check(bitmap.compress(format, quality, out)) { "The image could not be encoded as $mimeType" }
    return out.toByteArray()
  }

  /** Raw base64, no line breaks and no data-URL prefix — what the portal is sent. */
  fun toBase64(bytes: ByteArray): String = Base64.encodeToString(bytes, Base64.NO_WRAP)

  fun decode(base64: String, what: String, options: BitmapFactory.Options? = null): Bitmap {
    val bytes = try {
      Base64.decode(base64, Base64.DEFAULT)
    } catch (e: IllegalArgumentException) {
      throw ImageDecodeException(what, e)
    }
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options) ?: throw ImageDecodeException(what)
  }

  /**
   * Decodes at the largest power-of-two reduction that still covers [side] on the long edge. A
   * full-resolution capture decoded whole is tens of megabytes of pixels — enough to run a
   * background thread out of memory just to draw a notification thumbnail.
   */
  fun decodeWithin(base64: String, what: String, side: Int): Bitmap {
    val bytes = try {
      Base64.decode(base64, Base64.DEFAULT)
    } catch (e: IllegalArgumentException) {
      throw ImageDecodeException(what, e)
    }
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(bytes, 0, bytes.size, bounds)
    var sample = 1
    while (max(bounds.outWidth, bounds.outHeight) / (sample * 2) >= side) {
      sample *= 2
    }
    val options = BitmapFactory.Options().apply { inSampleSize = sample }
    return BitmapFactory.decodeByteArray(bytes, 0, bytes.size, options) ?: throw ImageDecodeException(what)
  }

  /** Filtered resize to [width], keeping the aspect. The same bitmap when nothing changes. */
  fun scaleToWidth(bitmap: Bitmap, width: Int): Bitmap {
    if (width == bitmap.width) {
      return bitmap
    }
    val height = max(1, (bitmap.height.toDouble() * width / bitmap.width).roundToInt())
    return Bitmap.createScaledBitmap(bitmap, width, height, true)
  }
}
