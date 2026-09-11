package expo.modules.trackernative

import android.graphics.Bitmap
import android.media.Image
import java.nio.Buffer
import java.nio.ByteBuffer

/**
 * Turns a frame from the capture's ImageReader into a Bitmap of exactly the screen.
 *
 * An RGBA_8888 frame's rows are often wider than the screen (the GPU pads each row to its own
 * alignment), and the last row is not always padded. So the pixels are copied row by row, each
 * cut to the screen's width — never the whole buffer at once, which would either smear the
 * padding into the picture or read past the end of the buffer on some devices.
 */
internal object ScreenFrame {
  fun toBitmap(image: Image): Bitmap {
    val plane = image.planes[0]
    val rowBytes = image.width * plane.pixelStride
    val pixels = ByteArray(rowBytes * image.height)
    val source: ByteBuffer = plane.buffer
    // Positioned through its Buffer supertype: ByteBuffer.position(int) returns ByteBuffer only
    // on newer runtimes, and the frame is re-read every capture while the screen stands still.
    val cursor: Buffer = source
    for (row in 0 until image.height) {
      cursor.position(row * plane.rowStride)
      source.get(pixels, row * rowBytes, rowBytes)
    }
    return Bitmap.createBitmap(image.width, image.height, Bitmap.Config.ARGB_8888).apply {
      copyPixelsFromBuffer(ByteBuffer.wrap(pixels))
      // A screen has no transparency; marking the bitmap opaque lets PNG drop the alpha channel.
      setHasAlpha(false)
    }
  }
}
