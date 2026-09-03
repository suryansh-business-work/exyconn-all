import type { BrowserWindow } from 'electron';
import { IPC } from '@shared/types';

/**
 * Holds a quit back while an upload is in flight.
 *
 * Closing the window is the one moment an employee can lose work they have already done:
 * the outbox is durable across restarts, but a capture that is mid-upload when the process
 * dies has to go up again, and a sign-out flush that never finished strands the session's
 * last bucket. So the app says what is happening, waits for it, and quits on its own.
 *
 * It is a hold, not a veto — an upload that will not finish must never trap somebody in an
 * app they asked to close, so the wait has a ceiling.
 */
const MAX_WAIT_MS = 30_000;

/** How often the guard re-checks whether the upload has landed. */
const POLL_MS = 500;

export interface CloseGuardHooks {
  /** Whether an upload is in flight right now. */
  isSyncing: () => boolean;
  /** How many items are still queued, so the dialog can say what it is waiting for. */
  pending: () => number;
  /** Called once the upload has landed (or the wait ran out) and the app may quit. */
  release: () => void;
}

let waiting = false;

/** True while the guard is holding a quit — so a second close does not stack another wait. */
export function isHoldingClose(): boolean {
  return waiting;
}

/**
 * Tells the renderer what is still going up, then quits once it lands.
 *
 * Returns false when there is nothing in flight, which means the caller should just close.
 */
export function holdForUpload(window: BrowserWindow | null, hooks: CloseGuardHooks): boolean {
  if (!hooks.isSyncing()) {
    return false;
  }
  if (waiting) {
    return true;
  }
  waiting = true;

  // The window is what the employee just clicked close on; show them why it did not close.
  if (window !== null && !window.isDestroyed()) {
    window.show();
    window.webContents.send(IPC.closeBlocked, hooks.pending());
  }

  const startedAt = Date.now();
  const timer = setInterval(() => {
    const finished = !hooks.isSyncing();
    if (!finished && Date.now() - startedAt < MAX_WAIT_MS) {
      return;
    }
    clearInterval(timer);
    waiting = false;
    if (window !== null && !window.isDestroyed()) {
      window.webContents.send(IPC.closeReleased);
    }
    hooks.release();
  }, POLL_MS);

  return true;
}
