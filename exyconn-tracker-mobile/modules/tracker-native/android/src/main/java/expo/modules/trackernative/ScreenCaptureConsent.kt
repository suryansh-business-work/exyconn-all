package expo.modules.trackernative

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionConfig
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.util.Log

/**
 * Asking for screen capture, and handing the answer to the foreground service.
 *
 * Android 14 fixes the order: consent first, then the service goes foreground as a
 * mediaProjection service, and only then may the consent become a projection. So an accepted
 * consent is parked here as a [Grant] and the service is poked; the service takes it once it
 * holds the right foreground type, and settles the JS promise with whether capture went live.
 */
internal object ScreenCaptureConsent {
  /** Below 0x10000: FragmentActivity refuses request codes that use the upper 16 bits. */
  private const val REQUEST_CODE = 0x7C01

  class Grant(val resultCode: Int, val data: Intent, private val onResult: (Boolean) -> Unit) {
    fun settle(live: Boolean) = onResult(live)
  }

  private val lock = Any()
  private var awaiting: ((Boolean) -> Unit)? = null
  private var grant: Grant? = null

  /** Must run on the main thread: it starts an activity. */
  fun request(activity: Activity?, onResult: (Boolean) -> Unit) {
    if (ScreenCaptureSession.isLive) {
      onResult(true)
      return
    }
    if (activity == null) {
      Log.e(LOG_TAG, "No activity to show the screen-capture consent from")
      onResult(false)
      return
    }
    // A consent whose answer never arrived (its activity died) must not block every later one.
    replaceAwaiting(onResult)?.invoke(false)
    try {
      activity.startActivityForResult(consentIntent(activity), REQUEST_CODE)
    } catch (e: ActivityNotFoundException) {
      Log.e(LOG_TAG, "This device has no screen-capture consent screen", e)
      replaceAwaiting(null)?.invoke(false)
    }
  }

  fun onActivityResult(context: Context, requestCode: Int, resultCode: Int, data: Intent?) {
    if (requestCode != REQUEST_CODE) {
      return
    }
    val onResult = replaceAwaiting(null) ?: return
    if (resultCode != Activity.RESULT_OK || data == null) {
      onResult(false)
      return
    }
    synchronized(lock) { grant = Grant(resultCode, data, onResult) }
    try {
      KeepAliveService.attachProjection(context)
    } catch (e: RuntimeException) {
      Log.e(LOG_TAG, "The tracking service could not take the screen capture", e)
      takeGrant()?.settle(false)
    }
  }

  fun hasGrant(): Boolean = synchronized(lock) { grant != null }

  fun takeGrant(): Grant? = synchronized(lock) { grant.also { grant = null } }

  private fun replaceAwaiting(next: ((Boolean) -> Unit)?): ((Boolean) -> Unit)? =
    synchronized(lock) { awaiting.also { awaiting = next } }

  /**
   * On Android 14+ the dialog offers the whole screen only. A single-app share would record
   * nothing but the app the employee picked — not the screen the desktop tracker captures, and
   * not what a manager reading the screenshot would assume they are looking at.
   */
  private fun consentIntent(context: Context): Intent {
    val manager: MediaProjectionManager = context.service()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return manager.createScreenCaptureIntent(MediaProjectionConfig.createConfigForDefaultDisplay())
    }
    return manager.createScreenCaptureIntent()
  }
}
