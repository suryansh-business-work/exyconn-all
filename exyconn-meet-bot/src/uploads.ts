import { ApiError } from './api';
import { errorText, log } from './log';

const ATTEMPTS = 6;
const wait = (ms: number) => new Promise((resolve) => globalThis.setTimeout(resolve, ms));

/** Retries a request that failed for a reason that may pass: the network, 429 or a 5xx. */
async function withRetry(label: string, send: () => Promise<void>): Promise<void> {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
    try {
      await send();
      return;
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 0;
      const retryable = status === 0 || status === 429 || status >= 500;
      if (!retryable || attempt === ATTEMPTS) {
        log('error', `${label} was not uploaded`, { err: errorText(error), attempt });
        return;
      }
      await wait(2000 * attempt);
    }
  }
}

/**
 * Uploads one after another in the order they were added, retrying each; a piece that keeps
 * failing is logged and skipped so the rest of the call is still saved.
 */
export class UploadQueue {
  private tail: Promise<void> = Promise.resolve();

  add(label: string, send: () => Promise<void>): void {
    this.tail = this.tail.then(() => withRetry(label, send));
  }

  /** Resolves once everything added so far has been sent (or given up on). */
  drained(): Promise<void> {
    return this.tail;
  }
}
