package expo.modules.trackernative

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import java.util.concurrent.ConcurrentHashMap

/** How far back the first read looks for the app that came to the front. */
private const val LOOKBACK_MS = 5 * 60 * 1000L

/** Re-read the tail of the last window: an event can be recorded a moment after it happened. */
private const val OVERLAP_MS = 2_000L

internal data class ForegroundApp(val packageName: String, val label: String) {
  fun toMap() = mapOf("packageName" to packageName, "label" to label)
}

/**
 * The app in front, from usage stats — the phone's version of the desktop's active window.
 *
 * Usage stats only record the moment an app comes to the front, so an employee who stays in one
 * app for an hour produces no events at all. Each read therefore continues from where the last
 * one stopped and remembers the answer, instead of forgetting the app once its event is older
 * than the lookback window.
 */
internal class ForegroundAppReader(private val context: Context) {
  private val labels = ConcurrentHashMap<String, String>()
  private var queriedUntil = 0L
  private var latestPackage: String? = null

  /** Null without Usage access — never a guess. */
  @Synchronized
  fun current(): ForegroundApp? {
    if (!UsageAccess.isGranted(context)) {
      return null
    }
    val now = System.currentTimeMillis()
    val from = maxOf(queriedUntil - OVERLAP_MS, now - LOOKBACK_MS)
    latestResumed(from, now)?.let { latestPackage = it }
    queriedUntil = now
    return latestPackage?.let { ForegroundApp(it, labelOf(it)) }
  }

  /**
   * The last app resumed in the window. Events come oldest first, so the last match wins.
   * ACTIVITY_RESUMED (Android 10) has the value MOVE_TO_FOREGROUND had before it, so the one
   * constant reads correctly on every supported version.
   */
  private fun latestResumed(from: Long, to: Long): String? {
    val events = context.service<UsageStatsManager>().queryEvents(from, to) ?: return null
    val event = UsageEvents.Event()
    var latest: String? = null
    while (events.hasNextEvent()) {
      events.getNextEvent(event)
      if (event.eventType == UsageEvents.Event.ACTIVITY_RESUMED) {
        latest = event.packageName
      }
    }
    return latest
  }

  /**
   * The name the employee knows the app by. An app this one cannot see (see the manifest's
   * `<queries>`) keeps its package name, which is still the truth, just less friendly.
   */
  private fun labelOf(packageName: String): String =
    labels.getOrPut(packageName) {
      try {
        val manager = context.packageManager
        manager.getApplicationLabel(applicationInfo(manager, packageName)).toString()
      } catch (e: PackageManager.NameNotFoundException) {
        packageName
      }
    }

  @Suppress("DEPRECATION") // The ApplicationInfoFlags overload needs Android 13.
  private fun applicationInfo(manager: PackageManager, packageName: String) =
    manager.getApplicationInfo(packageName, 0)
}
