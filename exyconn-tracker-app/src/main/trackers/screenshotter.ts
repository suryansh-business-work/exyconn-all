import { desktopCapturer, screen, nativeImage } from 'electron';
import type { TrackerSettings } from '@shared/types';

export interface Capture {
  /** JPEG data-URL, downscaled and (optionally) blurred, ready to POST. */
  image: string;
  displayId: string;
  blurred: boolean;
}

/**
 * Captures every display and returns compressed JPEG data-URLs.
 *
 * desktopCapturer is main-process only (since Electron 17). We request thumbnails at each
 * display's native pixel size, then downscale to the configured max width and JPEG-encode
 * to keep the upload small. Blur, when enabled, is a coarse downscale-then-upscale so the
 * manager sees layout/context but not readable on-screen content.
 */
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
    const source =
      sources.find((s) => s.display_id === String(display.id)) ?? sources[0];
    if (!source) {
      return null;
    }

    const processed = this.process(source.thumbnail, settings);
    return {
      image: processed.toJPEG(settings.screenshotQuality).toString('base64'),
      displayId: String(display.id),
      blurred: settings.blurScreenshots,
    };
  }

  /** Downscales to the max width, and coarsely pixelates when blur is on. */
  private process(source: Electron.NativeImage, settings: TrackerSettings): Electron.NativeImage {
    const size = source.getSize();
    const targetWidth = Math.min(settings.screenshotMaxWidth, size.width);

    if (!settings.blurScreenshots) {
      return source.resize({ width: targetWidth, quality: 'good' });
    }

    // Blur: shrink hard, then blow back up — content becomes unreadable, layout survives.
    const tiny = source.resize({ width: Math.max(64, Math.round(targetWidth / 12)) });
    return nativeImage.createFromBuffer(tiny.toPNG()).resize({ width: targetWidth });
  }
}
