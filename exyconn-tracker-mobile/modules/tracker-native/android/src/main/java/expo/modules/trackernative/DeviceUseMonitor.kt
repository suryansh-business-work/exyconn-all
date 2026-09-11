package expo.modules.trackernative

import android.app.KeyguardManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.PowerManager
import android.os.SystemClock
import androidx.core.content.ContextCompat

private const val MS_PER_SECOND = 1000.0

/**
 * Whether the phone is in use — the phone's counterpart of the desktop's input idle timer.
 *
 * A phone has no keyboard or mouse to watch, but it has something better: a phone that is off
 * or locked is not being used, whatever a timer says. "Out of use" is therefore the screen off
 * OR the keyguard up, and a run of it lasts until the employee is back past the lock screen.
 *
 * The receiver catches each transition as it happens; every read also re-checks the live state,
 * so a broadcast that arrives late cannot leave the count stuck.
 */
internal class DeviceUseMonitor(private val context: Context) {
  private val power: PowerManager = context.service()
  private val keyguard: KeyguardManager = context.service()

  private val receiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
      reconcile()
    }
  }

  private var registered = false

  /** When the current out-of-use run began (elapsed realtime, so deep sleep counts), or null. */
  private var inactiveSince: Long? = null

  /** The run that ended since the last read, waiting to be reported once. */
  private var completedRunMs = 0L

  @Synchronized
  fun start() {
    if (registered) {
      return
    }
    reconcile()
    val filter = IntentFilter().apply {
      addAction(Intent.ACTION_SCREEN_OFF)
      addAction(Intent.ACTION_SCREEN_ON)
      addAction(Intent.ACTION_USER_PRESENT)
    }
    // System broadcasts still reach a non-exported receiver; nothing else can.
    ContextCompat.registerReceiver(context, receiver, filter, ContextCompat.RECEIVER_NOT_EXPORTED)
    registered = true
  }

  @Synchronized
  fun stop() {
    if (!registered) {
      return
    }
    context.unregisterReceiver(receiver)
    registered = false
  }

  /**
   * The current run while it lasts; once it has ended, its full length exactly once, then 0.
   *
   * JS reads this once a second. A face-unlock can end a run between two reads, and without the
   * one-time report the phone would look as if it had never been put down at all.
   */
  @Synchronized
  fun idleSeconds(): Double {
    reconcile()
    val since = inactiveSince
    if (since != null) {
      return (SystemClock.elapsedRealtime() - since) / MS_PER_SECOND
    }
    val reported = completedRunMs / MS_PER_SECOND
    completedRunMs = 0
    return reported
  }

  @Synchronized
  private fun reconcile() {
    val inactive = !power.isInteractive || keyguard.isKeyguardLocked
    val since = inactiveSince
    if (inactive) {
      if (since == null) {
        inactiveSince = SystemClock.elapsedRealtime()
      }
    } else if (since != null) {
      completedRunMs = SystemClock.elapsedRealtime() - since
      inactiveSince = null
    }
  }
}
