import { Notification, nativeImage } from 'electron';
import type { LiveStats } from '@shared/types';

/**
 * Width the capture is downscaled to for the notification thumbnail. A full-resolution (and
 * at quality 100, lossless) screenshot is far too much to hand the OS notification centre
 * just to draw a preview a few hundred pixels wide.
 */
const PREVIEW_WIDTH = 480;

/**
 * Builds the preview the employee actually sees in the notification.
 *
 * Showing the shot itself is the point: "a screenshot was taken" asks them to take our word
 * for what was captured, while the picture shows them. Best-effort — a preview that cannot be
 * decoded must never cost them the notification.
 */
function preview(image: string | undefined): Electron.NativeImage | undefined {
  if (image === undefined) {
    return undefined;
  }
  try {
    const full = nativeImage.createFromBuffer(Buffer.from(image, 'base64'));
    if (full.isEmpty()) {
      return undefined;
    }
    return full.resize({ width: PREVIEW_WIDTH, quality: 'good' });
  } catch {
    return undefined;
  }
}

/** "2h 05m" — compact worked-time for a notification body. */
function clock(ms: number): string {
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

/** Share of the session spent active, 0–100. */
function activityPercent(stats: LiveStats): number {
  const total = stats.sessionActiveMs + stats.sessionIdleMs;
  if (total <= 0) {
    return 0;
  }
  return Math.round((stats.sessionActiveMs / total) * 100);
}

/**
 * Tells the employee, on the OS's own notification surface, that a screenshot was just
 * taken — showing them the shot itself, with a short summary of the session so far. It
 * includes the webcam photo when one was taken, because it is composited into the very image
 * being previewed. Capturing someone's screen silently
 * is exactly what makes monitoring feel like surveillance; this makes every capture
 * visible at the moment it happens.
 *
 * Notifications are best-effort: if the OS has them muted we simply skip, never throw.
 */
export function notifyScreenshotCaptured(
  count: number,
  stats: LiveStats,
  /** Base64 of one of the captures, shown in the notification so they can see what was taken. */
  image?: string,
): void {
  if (!Notification.isSupported()) {
    return;
  }

  const shots = count === 1 ? 'Screenshot captured' : `${count} screenshots captured`;
  const body = [
    `Worked ${clock(stats.sessionActiveMs)} · ${activityPercent(stats)}% active`,
    `${stats.keyCount.toLocaleString()} keys · ${stats.mouseCount.toLocaleString()} clicks`,
    stats.currentApp ? `In ${stats.currentApp}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    new Notification({
      title: `Exyconn Tracker — ${shots}`,
      body,
      icon: preview(image),
      silent: false,
    }).show();
  } catch {
    // A muted/unsupported notification centre must never break tracking.
  }
}
