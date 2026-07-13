import { Notification } from 'electron';
import type { LiveStats } from '@shared/types';

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
 * taken — with a short summary of the session so far. Capturing someone's screen silently
 * is exactly what makes monitoring feel like surveillance; this makes every capture
 * visible at the moment it happens.
 *
 * Notifications are best-effort: if the OS has them muted we simply skip, never throw.
 */
export function notifyScreenshotCaptured(count: number, stats: LiveStats): void {
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
      silent: false,
    }).show();
  } catch {
    // A muted/unsupported notification centre must never break tracking.
  }
}
