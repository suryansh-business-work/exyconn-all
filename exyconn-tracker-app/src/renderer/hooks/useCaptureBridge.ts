import { useEffect } from 'react';
import { composeCapture } from '../capture/compose';

/**
 * Answers the main process's capture requests: takes the webcam photo and composites it into
 * the screenshot, because a camera and a canvas exist in a renderer and nowhere else.
 *
 * Mounted at the root, not in a screen, for the same reason the shutter sound is: a capture
 * fires whatever the employee is looking at — the dashboard, their report, the settings, or
 * nothing at all because the app is sitting hidden in the tray.
 *
 * Every failure is reported back rather than thrown. Main then uploads the plain screenshot,
 * so a camera that is missing, busy or refused never costs the employee tracked time.
 */
export default function useCaptureBridge(): void {
  useEffect(
    () =>
      window.tracker.onCaptureRequested((request) => {
        composeCapture(request)
          .then((image) => window.tracker.sendCaptureResult({ id: request.id, image, error: null }))
          .catch((error: unknown) => {
            window.tracker.sendCaptureResult({
              id: request.id,
              image: null,
              error: error instanceof Error ? error.message : 'The webcam photo failed.',
            });
          });
      }),
    [],
  );
}
