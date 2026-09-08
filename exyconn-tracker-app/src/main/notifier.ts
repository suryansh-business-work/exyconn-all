import { Notification, nativeImage } from 'electron';
import type { CaptureEvent, LiveStats } from '@shared/types';
import { heroToastXml } from './toast';

/**
 * Width the capture is downscaled to for the notification thumbnail. A full-resolution (and
 * at quality 100, lossless) screenshot is far too much to hand the OS notification centre
 * just to draw a preview a few hundred pixels wide.
 */
const PREVIEW_WIDTH = 480;

/**
 * Every notification still on screen.
 *
 * A `Notification` nothing references any more can be collected before the OS has finished
 * with it, and the toast then never appears — one of the ways "the tracker does not notify
 * me" happens, and a likelier one now that a notification carries a click handler which has
 * to outlive the call that showed it. Held until the OS says it is done with it.
 */
const onScreen = new Set<Notification>();

/** Shows a notification and keeps it referenced until the OS is finished with it. */
function present(notification: Notification): void {
  onScreen.add(notification);
  const forget = (): void => {
    onScreen.delete(notification);
  };
  notification.on('close', forget);
  notification.on('failed', forget);
  notification.show();
}

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

/**
 * The picture across the top of the notification is a Windows-only placement, and it only
 * exists for a toast handed over as raw XML — every other platform draws `icon` beside the
 * text instead.
 */
function heroToast(
  title: string,
  lines: string[],
  shot: Electron.NativeImage | undefined,
): string | undefined {
  if (process.platform !== 'win32' || shot === undefined) {
    return undefined;
  }
  return heroToastXml(title, lines, shot);
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

/** How the shell wants one capture announced. */
export interface CaptureNotice {
  /** Base64 of one of the captures, shown in the notification so they can see what was taken. */
  image?: string;
  /** The workspace or this install has muted the capture sound. The toast is still shown. */
  silent: boolean;
  /** Opens the shot itself — wired to the notification's click. */
  onOpen: () => void;
}

/** The line that tells them the notification is not just a message, it is a door. */
const OPEN_HINT = 'Click to open it';

/**
 * Tells the employee, on the OS's own notification surface, that a screenshot was just
 * taken — showing them the shot itself, with a short summary of the session so far. It
 * includes the webcam photo when one was taken, because it is composited into the very image
 * being previewed. Capturing someone's screen silently
 * is exactly what makes monitoring feel like surveillance; this makes every capture
 * visible at the moment it happens.
 *
 * Clicking it opens the gallery on that shot's day. A preview a few hundred pixels wide shows
 * that something was captured and very little of what — the person being photographed is owed
 * one click to the full-size picture rather than a hunt through a menu.
 *
 * Notifications are best-effort: if the OS has them muted we simply skip, never throw.
 */
export function notifyScreenshotCaptured(
  capture: CaptureEvent,
  stats: LiveStats,
  notice: CaptureNotice,
): void {
  if (!Notification.isSupported()) {
    return;
  }

  const shots =
    capture.count === 1 ? 'Screenshot captured' : `${capture.count} screenshots captured`;
  const title = `Exyconn Tracker — ${shots}`;
  const lines = [
    `Worked ${clock(stats.sessionActiveMs)} · ${activityPercent(stats)}% active`,
    `${stats.keyCount.toLocaleString()} keys · ${stats.mouseCount.toLocaleString()} clicks`,
    stats.currentApp ? `In ${stats.currentApp}` : '',
    OPEN_HINT,
  ].filter(Boolean);

  const shot = preview(notice.image);

  try {
    const notification = new Notification({
      title,
      body: lines.join('\n'),
      // Windows draws the shot full-width above the text; elsewhere the OS puts it alongside.
      toastXml: heroToast(title, lines, shot),
      icon: shot,
      silent: notice.silent,
    });
    notification.on('click', notice.onOpen);
    present(notification);
  } catch {
    // A muted/unsupported notification centre must never break tracking.
  }
}

/**
 * Says why tracking stopped on its own.
 *
 * The app pausing itself is a decision the employee did not make, so it is never allowed to
 * happen quietly: they come back to a paused tracker and this is what tells them why, and
 * that resuming is one press.
 */
export function notifyAutoPaused(idleMinutes: number): void {
  if (!Notification.isSupported()) {
    return;
  }
  try {
    present(
      new Notification({
        title: 'Exyconn Tracker — paused',
        body: `No activity for ${idleMinutes} minutes. Press Resume when you are back.`,
        silent: false,
      }),
    );
  } catch {
    // A muted/unsupported notification centre must never break tracking.
  }
}

/**
 * Says that the workspace's schedule has closed the working day.
 *
 * The app stopping is a decision the employee did not make, and its consequence is one they
 * need in words: from this moment nothing they do is logged. The dashboard warns them on the
 * way in — this is what reaches them once the window has actually shut, which is usually
 * while they are still typing.
 */
export function notifyAutoStopped(stopLabel: string): void {
  if (!Notification.isSupported()) {
    return;
  }
  try {
    present(
      new Notification({
        title: 'Exyconn Tracker — stopped for the day',
        body: `Your tracking window ended at ${stopLabel}. Time from now on is not being logged.`,
        silent: false,
      }),
    );
  } catch {
    // A muted/unsupported notification centre must never break tracking.
  }
}
