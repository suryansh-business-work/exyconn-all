import { desktopCapturer, screen, nativeImage } from 'electron';
import type { TrackerSettings } from '@shared/types';
import {
  blurWidth,
  capturePolicy,
  needsFallback,
  JPEG_MIME,
  type CapturePolicy,
} from './capture-policy';

export interface Capture {
  /** Base64 of the encoded capture (no data-URL prefix), ready to POST. */
  image: string;
  /** What `image` is encoded as — PNG at quality 100, JPEG below it. */
  mimeType: string;
  displayId: string;
  blurred: boolean;
}

/**
 * Captures every display and returns encoded, base64 data.
 *
 * desktopCapturer is main-process only (since Electron 17). We request thumbnails at each
 * display's native pixel size, then encode according to the workspace's quality dial: at 100
 * the native-resolution image is kept and PNG-encoded losslessly, below it the shot is
 * downscaled to the configured max width and JPEG-encoded to keep the upload small. Blur,
 * when enabled, is a coarse downscale-then-upscale so the manager sees layout/context but not
 * readable on-screen content.
 */
/**
 * Encodes the processed image, keeping it inside what the portal will accept.
 *
 * A lossless encode that is too big becomes a quality-100 JPEG at the SAME resolution rather
 * than being downscaled or — as it was — refused by the server and dropped from the outbox,
 * which is what made quality 100 produce no screenshots at all.
 */
function encode(
  image: Electron.NativeImage,
  policy: CapturePolicy,
  quality: number,
): { buffer: Buffer; mimeType: string } {
  if (!policy.lossless) {
    return { buffer: image.toJPEG(quality), mimeType: policy.mimeType };
  }
  const png = image.toPNG();
  if (!needsFallback(true, png.length)) {
    return { buffer: png, mimeType: policy.mimeType };
  }
  return { buffer: image.toJPEG(100), mimeType: JPEG_MIME };
}

export class Screenshotter {
  async capture(settings: TrackerSettings): Promise<Capture[]> {
    const displays = screen.getAllDisplays();
    const results: Capture[] = [];

    for (const display of displays) {
      const capture = await this.captureDisplay(display, settings);
      if (capture) {
        results.push(capture);
      }
    }
    return results;
  }

  private async captureDisplay(
    display: Electron.Display,
    settings: TrackerSettings,
  ): Promise<Capture | null> {
    const thumbnailSize = {
      width: Math.round(display.size.width * display.scaleFactor),
      height: Math.round(display.size.height * display.scaleFactor),
    };
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize });
    const source = sources.find((s) => s.display_id === String(display.id)) ?? sources[0];
    if (!source) {
      return null;
    }

    const policy = capturePolicy(settings, source.thumbnail.getSize().width);
    const processed = this.process(source.thumbnail, settings, policy.targetWidth);
    const { buffer, mimeType } = encode(processed, policy, settings.screenshotQuality);

    return {
      image: buffer.toString('base64'),
      mimeType,
      displayId: String(display.id),
      blurred: settings.blurScreenshots,
    };
  }

  /**
   * Downscales to the target width (or leaves the image alone when there is none, which is
   * what quality 100 asks for), and coarsely pixelates when blur is on.
   */
  private process(
    source: Electron.NativeImage,
    settings: TrackerSettings,
    targetWidth: number | null,
  ): Electron.NativeImage {
    const width = targetWidth ?? source.getSize().width;

    if (!settings.blurScreenshots) {
      return targetWidth === null ? source : source.resize({ width, quality: 'good' });
    }

    const tiny = source.resize({ width: blurWidth(width) });
    return nativeImage.createFromBuffer(tiny.toPNG()).resize({ width });
  }
}
