package expo.modules.trackernative

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.util.Log
import androidx.core.app.NotificationCompat

private const val CHANNEL_ID = "tracker_status"

/**
 * The ongoing notification Android requires while the tracking service runs — and the honest
 * one: while it is in the shade, the tracker is tracking. Low importance, because it is a state,
 * not news; shown at once rather than after Android 12's default ten-second grace.
 */
internal object KeepAliveNotification {
  const val ID = 7101

  fun build(context: Context, title: String, body: String): Notification {
    ensureChannel(context)
    return NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(NotificationSupport.smallIcon(context))
      .setContentTitle(title)
      .setContentText(body)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setCategory(NotificationCompat.CATEGORY_SERVICE)
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .setContentIntent(openApp(context))
      .build()
  }

  /** Idempotent: Android keeps the first definition of a channel and ignores repeats. */
  private fun ensureChannel(context: Context) {
    val name = context.getString(R.string.tracker_native_status_channel)
    val channel = NotificationChannel(CHANNEL_ID, name, NotificationManager.IMPORTANCE_LOW).apply {
      setShowBadge(false)
    }
    context.service<NotificationManager>().createNotificationChannel(channel)
  }

  private fun openApp(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
    if (launch == null) {
      Log.e(LOG_TAG, "The app has no launch activity; the status notification opens nothing")
      return null
    }
    return NotificationSupport.activityIntent(context, ID, launch)
  }
}
