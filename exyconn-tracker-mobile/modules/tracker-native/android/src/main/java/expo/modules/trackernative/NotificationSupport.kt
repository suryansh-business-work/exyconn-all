package expo.modules.trackernative

import android.Manifest
import android.annotation.SuppressLint
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationManagerCompat

/** The monochrome icon the expo-notifications config plugin generates into the app's drawables. */
private const val ICON_NAME = "notification_icon"

/** What both of this module's notifications — the session status and the capture — share. */
internal object NotificationSupport {
  /**
   * The app's own notification icon. It lives in the app module, not this library, so it can
   * only be found by name; the launcher icon stands in when a build did not generate it.
   */
  @SuppressLint("DiscouragedApi")
  fun smallIcon(context: Context): Int {
    val id = context.resources.getIdentifier(ICON_NAME, "drawable", context.packageName)
    return if (id != 0) id else context.applicationInfo.icon
  }

  /** False when the employee turned notifications off, or never allowed them on Android 13+. */
  fun canPost(context: Context): Boolean {
    val allowed = Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU ||
      context.isGranted(Manifest.permission.POST_NOTIFICATIONS)
    return allowed && NotificationManagerCompat.from(context).areNotificationsEnabled()
  }

  /**
   * Immutable, as Android 12+ requires; updated in place when the same request code reposts.
   * Typed nullable because the platform only promises non-null without FLAG_NO_CREATE.
   */
  fun activityIntent(context: Context, requestCode: Int, intent: Intent): PendingIntent? =
    PendingIntent.getActivity(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
}
