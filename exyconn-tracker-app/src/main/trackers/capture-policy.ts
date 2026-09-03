import type { TrackerSettings } from '@shared/types';

/** PNG is lossless; JPEG is not. The encoding follows straight from the quality dial. */
export const PNG_MIME = 'image/png';
export const JPEG_MIME = 'image/jpeg';

/** The top of the quality scale, where "best" has to mean actually best. */
const LOSSLESS = 100;

export interface CapturePolicy {
  /** Width to encode at, or `null` for "leave it at native resolution". */
  targetWidth: number | null;
  /** True at quality 100: encode PNG, so nothing the employee saw is thrown away. */
  lossless: boolean;
  mimeType: string;
}

/**
 * Turns the quality dial into an encoding decision.
 *
 * 100 is the honest top of the scale: the screen is kept at its native resolution and encoded
 * losslessly. A dial that read "100%" while still downscaling to 1280px and JPEG-compressing
 * would be lying about the one number an admin uses to judge what they are storing.
 *
 * Below 100 the shot is a JPEG at that quality, downscaled to the configured max width —
 * which is what keeps a day of screenshots to a sane upload size.
 */
export function capturePolicy(settings: TrackerSettings, nativeWidth: number): CapturePolicy {
  if (settings.screenshotQuality >= LOSSLESS) {
    return { targetWidth: null, lossless: true, mimeType: PNG_MIME };
  }
  return {
    targetWidth: Math.min(settings.screenshotMaxWidth, nativeWidth),
    lossless: false,
    mimeType: JPEG_MIME,
  };
}

/**
 * The blur pass: shrink hard, then blow back up, so on-screen content stops being readable
 * while the layout survives. Deliberately independent of the quality dial — blur is a privacy
 * decision, and a workspace that asks for lossless captures still gets unreadable ones.
 */
export function blurWidth(targetWidth: number): number {
  return Math.max(64, Math.round(targetWidth / 12));
}
