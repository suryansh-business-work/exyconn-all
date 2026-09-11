package expo.modules.trackernative

import android.Manifest
import android.app.AppOpsManager
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Log

/**
 * The Usage access grant — the one switch that lets the tracker see which app is in front.
 *
 * It is a special app-op, not a runtime permission: no dialog can ask for it, only the Settings
 * screen the employee is sent to.
 */
internal object UsageAccess {
  fun isGranted(context: Context): Boolean {
    val mode = checkOp(context.service(), context.packageName)
    // MODE_DEFAULT defers to the permission itself, which some OEM builds grant that way.
    if (mode == AppOpsManager.MODE_DEFAULT) {
      return context.isGranted(Manifest.permission.PACKAGE_USAGE_STATS)
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  /**
   * Opens Usage access — straight at this app's switch on Android 10+, where Settings accepts a
   * `package:` URI, else (or when an OEM Settings has no such page) the list of apps.
   */
  fun openSettings(context: Context) {
    val list = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      try {
        context.startActivity(Intent(list).setData(Uri.fromParts("package", context.packageName, null)))
        return
      } catch (e: ActivityNotFoundException) {
        Log.e(LOG_TAG, "Settings has no per-app Usage access page; opening the list", e)
      }
    }
    context.startActivity(list)
  }

  @Suppress("DEPRECATION") // checkOpNoThrow is the only form before Android 10.
  private fun checkOp(appOps: AppOpsManager, packageName: String): Int {
    val op = AppOpsManager.OPSTR_GET_USAGE_STATS
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      return appOps.unsafeCheckOpNoThrow(op, Process.myUid(), packageName)
    }
    return appOps.checkOpNoThrow(op, Process.myUid(), packageName)
  }
}
