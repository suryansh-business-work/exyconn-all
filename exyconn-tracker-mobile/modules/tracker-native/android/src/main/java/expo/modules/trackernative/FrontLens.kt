package expo.modules.trackernative

import android.graphics.ImageFormat
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.hardware.camera2.CameraMetadata
import android.util.Size
import kotlin.math.abs

/**
 * The desktop asks the webcam for 640×480; the phone takes the nearest size its front camera
 * offers. Sensor sizes are listed landscape, so this is compared before the photo is turned
 * upright.
 */
private const val TARGET_WIDTH = 640
private const val TARGET_HEIGHT = 480

/** The front camera and the sizes one small still needs from it. */
internal class FrontLens(
  val id: String,
  /** Clockwise degrees that turn the sensor's picture upright on a phone held upright. */
  val sensorOrientation: Int,
  val stillSize: Size,
  /** The metering stream that lets auto-exposure settle before the still. */
  val meterSize: Size,
) {
  companion object {
    /** Null on a phone without a usable front camera. */
    fun find(manager: CameraManager): FrontLens? {
      for (id in manager.cameraIdList) {
        val lens = describe(id, manager.getCameraCharacteristics(id))
        if (lens != null) {
          return lens
        }
      }
      return null
    }

    private fun describe(id: String, characteristics: CameraCharacteristics): FrontLens? {
      if (characteristics.get(CameraCharacteristics.LENS_FACING) != CameraMetadata.LENS_FACING_FRONT) {
        return null
      }
      val sizes = characteristics.get(CameraCharacteristics.SCALER_STREAM_CONFIGURATION_MAP) ?: return null
      val still = nearest(sizes.getOutputSizes(ImageFormat.JPEG)) ?: return null
      val meter = nearest(sizes.getOutputSizes(ImageFormat.YUV_420_888)) ?: return null
      val orientation = characteristics.get(CameraCharacteristics.SENSOR_ORIENTATION) ?: 0
      return FrontLens(id, orientation, still, meter)
    }

    private fun nearest(sizes: Array<Size>?): Size? =
      sizes?.minByOrNull { abs(it.width - TARGET_WIDTH) + abs(it.height - TARGET_HEIGHT) }
  }
}
