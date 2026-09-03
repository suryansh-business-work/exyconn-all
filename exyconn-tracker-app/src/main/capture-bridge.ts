import { randomUUID } from 'node:crypto';
import { ipcMain, type BrowserWindow } from 'electron';
import { IPC, type CaptureRequest, type CaptureResult, type WebcamCorner } from '@shared/types';

/**
 * How long main waits for a renderer to answer a capture request. A webcam warms up in well
 * under a second; anything past this is a camera that is not coming, and the tracking loop
 * must not be held up by it — the screenshot goes up without the photo instead.
 */
const TIMEOUT_MS = 8_000;

/** In-flight requests, keyed by id, so several displays can be composited concurrently. */
const pending = new Map<string, (result: CaptureResult) => void>();

/** Wired once, at startup. Every renderer answers on the same channel, keyed by request id. */
export function registerCaptureBridge(): void {
  ipcMain.on(IPC.captureResult, (_event, result: CaptureResult) => {
    const settle = pending.get(result.id);
    if (settle) {
      pending.delete(result.id);
      settle(result);
    }
  });
}

export interface ComposeInput {
  screen: string;
  mimeType: string;
  corner: WebcamCorner;
  quality: number;
}

/**
 * Asks the renderer to take a webcam photo and composite it into the corner of a screenshot.
 *
 * This has to happen in a renderer: `getUserMedia` and a canvas exist there and nowhere in
 * the main process. The window is normally hidden in the tray when a capture fires, which is
 * fine — a hidden BrowserWindow still runs its JS, still reaches the camera, and still draws
 * to an offscreen canvas.
 *
 * Returns the composited image, or `null` for every failure — no camera, a denied permission,
 * a renderer that never answered. A missing photo must never cost the employee the screenshot
 * (and the tracked time) it belonged to.
 */
export function composeWithWebcam(
  window: BrowserWindow | null,
  input: ComposeInput,
): Promise<string | null> {
  if (window === null || window.isDestroyed()) {
    return Promise.resolve(null);
  }

  const request: CaptureRequest = { id: randomUUID(), ...input };

  return new Promise<string | null>((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(request.id);
      console.error('Webcam capture timed out; uploading the screenshot without a photo');
      resolve(null);
    }, TIMEOUT_MS);

    pending.set(request.id, (result) => {
      clearTimeout(timer);
      if (result.error !== null) {
        console.error(
          'Webcam capture failed; uploading the screenshot without a photo',
          result.error,
        );
      }
      resolve(result.image);
    });

    window.webContents.send(IPC.captureRequested, request);
  });
}
