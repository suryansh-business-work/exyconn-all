import { useEffect } from 'react';
import { playShutter } from '../shutter';

/**
 * Plays the camera shutter on every capture the main process reports.
 *
 * Mounted in the root App, not in a screen, so it keeps working while the tracker sits hidden
 * in the tray — which is where it usually is when a screenshot fires. A hidden BrowserWindow
 * still runs its JS and still plays audio.
 */
export default function useShutterSound(): void {
  useEffect(() => window.tracker.onScreenshotCaptured(() => playShutter()), []);
}
