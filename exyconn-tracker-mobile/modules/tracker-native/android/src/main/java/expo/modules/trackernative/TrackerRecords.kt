package expo.modules.trackernative

import android.graphics.RectF
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.records.Required

/*
 * The argument shapes JS sends, field for field with `src/native/tracker-native.ts`. Required
 * fields fail the call loudly when JS leaves them out, instead of quietly capturing at a default.
 */

/** `NativeCaptureOptions` — the desktop's capture policy, already decided in JS. */
class CaptureOptions : Record {
  @Field @Required val lossless: Boolean = false
  @Field @Required val quality: Int = 0
  @Field val targetWidth: Int? = null
  @Field val blurWidth: Int? = null
  @Field @Required val maxBytes: Int = 0
}

/** `NativeRect` — where the webcam photo goes, in the capture's pixels. */
class OverlayRect : Record {
  @Field @Required val x: Double = 0.0
  @Field @Required val y: Double = 0.0
  @Field @Required val width: Double = 0.0
  @Field @Required val height: Double = 0.0

  fun toRectF() = RectF(x.toFloat(), y.toFloat(), (x + width).toFloat(), (y + height).toFloat())
}

/** `NativeComposeInput`. */
class ComposeInput : Record {
  @Field @Required val screen: String = ""
  @Field @Required val mimeType: String = ""
  @Field @Required val photo: String = ""
  @Field @Required val rect: OverlayRect = OverlayRect()
  @Field @Required val quality: Int = 0
}

/** `NativeKeepAliveOptions`. */
class KeepAliveOptions : Record {
  @Field @Required val title: String = ""
  @Field @Required val body: String = ""
  @Field @Required val camera: Boolean = false
}

/**
 * `NativeCaptureNotification`. Its `mimeType` is not read: BitmapFactory recognises PNG and JPEG
 * from the bytes themselves.
 */
class CaptureNotificationOptions : Record {
  @Field @Required val title: String = ""
  @Field @Required val body: String = ""
  @Field @Required val image: String = ""
  @Field @Required val silent: Boolean = false
  @Field @Required val url: String = ""
}
