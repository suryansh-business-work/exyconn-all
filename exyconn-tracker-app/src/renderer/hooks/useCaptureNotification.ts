import { useEffect } from 'react';
import { dayBoundsOfInstant } from '../time';
import { run } from '../run';

/**
 * Opens the gallery when the employee clicks a capture notification.
 *
 * Main knows the instant the shot was taken but not which calendar day that is for THIS
 * employee — the day depends on the zone the app renders everything else in, and the renderer
 * is the one place that turns an instant into a day. So main asks, and this answers by
 * opening the gallery on that day, exactly as clicking the day in My Report would.
 *
 * Mounted at the root, like the shutter, because a capture notification is nearly always
 * clicked while the app is sitting in the tray with no screen on show at all.
 */
export default function useCaptureNotification(timezone: string): void {
  useEffect(
    () =>
      window.tracker.onOpenCaptureDay((capturedAt) => {
        const range = dayBoundsOfInstant(capturedAt, timezone);
        if (range === null) {
          return;
        }
        run(() => window.tracker.openScreenshots(range));
      }),
    [timezone],
  );
}
