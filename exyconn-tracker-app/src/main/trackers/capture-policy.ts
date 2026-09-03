import type { TrackerSettings } from '@shared/types';

/** PNG is lossless; JPEG is not. The encoding follows straight from the quality dial. */
export const PNG_MIME = 'image/png';
export const JPEG_MIME = 'image/jpeg';

/** The top of the quality scale, where "best" has to mean actually best. */
const LOSSLESS = 100;

/**
 * The largest capture the portal will take, in bytes.
 *
 * Deliberately under the server's own TRACKER_LIMITS.maxScreenshotBytes: an upload the
 * server refuses comes back BAD_USER_INPUT, which the outbox treats as permanent and drops.
 * A screenshot that is merely large must never become a screenshot that never existed, so
 * the app keeps itself inside the limit rather than finding out afterwards.
 */
export const MAX_CAPTURE_BYTES = 20 * 1024 * 1024;

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
 * 100 is the honest top of the scale: the screen is kept at its native resolution and
 * encoded losslessly. A dial that read "100%" while still downscaling to 1280px and
 * JPEG-compressing would be lying about the one number an admin uses to judge what they are
 * storing.
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
 * Whether a lossless encode has to give way to JPEG to fit through the portal.
 *
 * A PNG of a screen full of flat UI is a couple of megabytes; a screen full of photographs
 * or video is tens. Resolution is the quality an employee's manager actually looks at, so
 * when something has to give it is the encoder, never the pixel count — the shot stays
 * native-resolution and becomes a quality-100 JPEG, which is visually indistinguishable and
 * a fraction of the size.
 */
export function needsFallback(lossless: boolean, bytes: number): boolean {
  return lossless && bytes > MAX_CAPTURE_BYTES;
}

/**
 * The blur pass: shrink hard, then blow back up, so on-screen content stops being readable
 * while the layout survives. Deliberately independent of the quality dial — blur is a privacy
 * decision, and a workspace that asks for lossless captures still gets unreadable ones.
 */
export function blurWidth(targetWidth: number): number {
  return Math.max(64, Math.round(targetWidth / 12));
}
