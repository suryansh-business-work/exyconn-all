package expo.modules.trackernative

import android.content.Context
import android.content.pm.PackageManager
import androidx.core.content.ContextCompat

/**
 * A system service that every Android device has. Missing one means a broken ROM, which is worth
 * failing loudly on rather than treating as "no data".
 */
internal inline fun <reified T : Any> Context.service(): T =
  requireNotNull(getSystemService(T::class.java)) { "${T::class.java.simpleName} is not available" }

internal fun Context.isGranted(permission: String): Boolean =
  ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
