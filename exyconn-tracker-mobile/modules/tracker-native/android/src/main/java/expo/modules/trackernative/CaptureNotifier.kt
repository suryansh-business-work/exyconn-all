package expo.modules.trackernative

import android.annotation.SuppressLint
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.ContentResolver
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.media.AudioAttributes
import android.net.Uri
import android.provider.Settings
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import kotlin.math.max
import kotlin.math.min
import kotlin.math.roundToInt

private const val NOTIFICATION_ID = 7102
private const val CHANNEL_ID = "tracker_captures"
private const val SILENT_CHANNEL_ID = "tracker_captures_silent"

/** The raw resource expo-notifications copies from assets/camera_shutter.mp3. */
private const val SHUTTER_SOUND = "camera_shutter"

/**
 * The big picture is shown a few hundred dp wide at most; fitting it inside this square keeps a
 * tall phone screenshot small enough to cross Binder into the notification service.
 */
private const val MAX_PICTURE_SIDE = 1024

private val SOUND_ATTRIBUTES: AudioAttributes = AudioAttributes.Builder()
  .setUsage(AudioAttributes.USAGE_NOTIFICATION)
  .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
  .build()

/**
 * The notification that shows each capture the moment it is taken — the phone's version of the
 * desktop's rule that nobody is screenshotted without being told.
 *
 * The shutter is the channel's own sound, so "silent" means the silent channel: the sound and
 * the notification can never disagree. One fixed id, so each capture replaces the last and
 * alerts again instead of piling up a day of screenshots in the shade.
 */
internal object CaptureNotifier {
  /** Never throws: a capture notification that cannot be shown must not crash the tracker. */
  @SuppressLint("MissingPermission") // canPost checks POST_NOTIFICATIONS first.
  fun show(context: Context, options: CaptureNotificationOptions) {
    if (!NotificationSupport.canPost(context)) {
      return
    }
    try {
      ensureChannels(context)
      val picture = fitWithin(ImageCodec.decode(options.image, "capture preview"), MAX_PICTURE_SIDE)
      val notification = NotificationCompat.Builder(context, if (options.silent) SILENT_CHANNEL_ID else CHANNEL_ID)
        .setSmallIcon(NotificationSupport.smallIcon(context))
        .setContentTitle(options.title)
        .setContentText(options.body)
        .setStyle(NotificationCompat.BigPictureStyle().bigPicture(picture).setSummaryText(options.body))
        .setContentIntent(openUrl(context, options.url))
        .setAutoCancel(true)
        .build()
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    } catch (e: Exception) {
      Log.e(LOG_TAG, "The capture notification could not be shown", e)
    }
  }

  /** Idempotent: Android keeps the first definition of a channel, sound included. */
  private fun ensureChannels(context: Context) {
    val shutter = NotificationChannel(
      CHANNEL_ID,
      context.getString(R.string.tracker_native_captures_channel),
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply { setSound(shutterSound(context), SOUND_ATTRIBUTES) }
    val silent = NotificationChannel(
      SILENT_CHANNEL_ID,
      context.getString(R.string.tracker_native_captures_silent_channel),
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
      setSound(null, null)
      enableVibration(false)
    }
    context.service<NotificationManager>().createNotificationChannels(listOf(shutter, silent))
  }

  @SuppressLint("DiscouragedApi") // The sound lives in the app module; only its name is known here.
  private fun shutterSound(context: Context): Uri {
    val id = context.resources.getIdentifier(SHUTTER_SOUND, "raw", context.packageName)
    if (id == 0) {
      Log.e(LOG_TAG, "No $SHUTTER_SOUND raw resource in this build; captures use the default sound")
      return Settings.System.DEFAULT_NOTIFICATION_URI
    }
    return Uri.parse("${ContentResolver.SCHEME_ANDROID_RESOURCE}://${context.packageName}/$id")
  }

  /** Tapping opens that capture in the gallery — in this app, never whichever app claims the link. */
  private fun openUrl(context: Context, url: String) = NotificationSupport.activityIntent(
    context,
    NOTIFICATION_ID,
    Intent(Intent.ACTION_VIEW, Uri.parse(url))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK),
  )

  private fun fitWithin(bitmap: Bitmap, side: Int): Bitmap {
    val scale = min(1.0, side.toDouble() / max(bitmap.width, bitmap.height))
    if (scale == 1.0) {
      return bitmap
    }
    val width = max(1, (bitmap.width * scale).roundToInt())
    val height = max(1, (bitmap.height * scale).roundToInt())
    return Bitmap.createScaledBitmap(bitmap, width, height, true)
  }
}
