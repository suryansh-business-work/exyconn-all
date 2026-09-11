package expo.modules.trackernative

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import kotlin.math.max
import kotlin.math.roundToInt

/** Radius of the rounded frame around the photo, as a share of its width. */
private const val CORNER_RADIUS_RATIO = 0.06

/** Border thickness around the photo, so it reads as an inset and not as part of the screen. */
private const val BORDER_RATIO = 0.012

/** The frame is white but not quite opaque, so a bright screen behind it still shows through. */
private const val OUTLINE_OPACITY = 0.9f

private const val MAX_ALPHA = 255

/**
 * `composeWebcam`: the desktop's compose.ts, drawn with Android's canvas. The same rounded,
 * bordered card in the corner JS chose, and the result in the capture's own encoding — PNG stays
 * lossless, a JPEG keeps the workspace's quality.
 *
 * compose.ts strokes the border, then clips and draws the photo over it, so the photo covers the
 * inner half of the stroke. Filling the same rounded rect with the photo as a shader after the
 * stroke is that exact picture, with anti-aliased corners on every Android version.
 */
internal object WebcamCompositor {
  fun compose(input: ComposeInput): String {
    val screen = ImageCodec.decode(input.screen, "screen capture", BitmapFactory.Options().apply { inMutable = true })
    val photo = ImageCodec.decode(input.photo, "webcam photo")
    drawOverlay(Canvas(screen), photo, input.rect.toRectF())
    return ImageCodec.toBase64(ImageCodec.encode(screen, input.mimeType, input.quality))
  }

  private fun drawOverlay(canvas: Canvas, photo: Bitmap, rect: RectF) {
    val radius = (rect.width() * CORNER_RADIUS_RATIO).roundToInt().toFloat()
    val border = max(1, (rect.width() * BORDER_RATIO).roundToInt()).toFloat()
    canvas.drawRoundRect(rect, radius, radius, outlinePaint(border))
    canvas.drawRoundRect(rect, radius, radius, photoPaint(photo, rect))
  }

  private fun outlinePaint(border: Float) = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    style = Paint.Style.STROKE
    strokeWidth = border
    color = Color.WHITE
    alpha = (OUTLINE_OPACITY * MAX_ALPHA).roundToInt()
  }

  /** The photo stretched to fill [rect], as canvas drawImage(x, y, w, h) does. */
  private fun photoPaint(photo: Bitmap, rect: RectF): Paint {
    val source = RectF(0f, 0f, photo.width.toFloat(), photo.height.toFloat())
    val placement = Matrix().apply { setRectToRect(source, rect, Matrix.ScaleToFit.FILL) }
    val shader = BitmapShader(photo, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP).apply { setLocalMatrix(placement) }
    return Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG).apply { this.shader = shader }
  }
}
