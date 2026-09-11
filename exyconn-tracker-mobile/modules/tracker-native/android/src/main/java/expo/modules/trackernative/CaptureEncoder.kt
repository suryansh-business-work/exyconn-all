package expo.modules.trackernative

import android.graphics.Bitmap
import kotlin.math.min

internal class EncodedCapture(val base64: String, val mimeType: String, val width: Int, val height: Int) {
  fun toMap() = mapOf("base64" to base64, "mimeType" to mimeType, "width" to width, "height" to height)
}

/**
 * Encodes a screen frame exactly as the desktop's screenshotter does, from the policy JS already
 * decided with @exyconn/tracker-core: downscale (or keep native resolution at quality 100),
 * pixelate when blur is on, PNG when lossless else JPEG — and a PNG too big for the portal
 * becomes a quality-100 JPEG at the SAME size, because resolution is the quality a manager
 * actually looks at.
 */
internal object CaptureEncoder {
  fun encode(frame: Bitmap, options: CaptureOptions): EncodedCapture {
    // Never upscale: a target wider than the screen means "native", as on the desktop.
    val width = min(options.targetWidth ?: frame.width, frame.width)
    val image = process(frame, width, options.blurWidth)
    val (bytes, mimeType) = encodeWithinLimit(image, options)
    return EncodedCapture(ImageCodec.toBase64(bytes), mimeType, image.width, image.height)
  }

  /**
   * The blur pass shrinks hard and blows back up, so text stops being readable while the layout
   * survives. It works from the full frame, like the desktop, not from an already-shrunk copy.
   */
  private fun process(frame: Bitmap, width: Int, blurWidth: Int?): Bitmap {
    if (blurWidth == null) {
      return ImageCodec.scaleToWidth(frame, width)
    }
    val tiny = ImageCodec.scaleToWidth(frame, blurWidth)
    return ImageCodec.scaleToWidth(tiny, width)
  }

  private fun encodeWithinLimit(image: Bitmap, options: CaptureOptions): Pair<ByteArray, String> {
    if (!options.lossless) {
      return ImageCodec.encode(image, ImageCodec.JPEG_MIME, options.quality) to ImageCodec.JPEG_MIME
    }
    val png = ImageCodec.encode(image, ImageCodec.PNG_MIME, ImageCodec.BEST_QUALITY)
    if (png.size <= options.maxBytes) {
      return png to ImageCodec.PNG_MIME
    }
    return ImageCodec.encode(image, ImageCodec.JPEG_MIME, ImageCodec.BEST_QUALITY) to ImageCodec.JPEG_MIME
  }
}
