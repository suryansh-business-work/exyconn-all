import type { LogBatch } from '@exyconn/logger';
import type { WorkerReply, WorkerRequest } from '../types/messages';

/**
 * Sends one request to the service worker and unwraps its reply. A rejected request or an
 * error reply becomes a thrown Error, so callers handle one failure path.
 */
export async function askWorker<T>(request: WorkerRequest): Promise<T> {
  const reply = (await chrome.runtime.sendMessage(request)) as WorkerReply<T> | undefined;
  if (reply === undefined) {
    throw new Error('The extension did not answer');
  }
  if (!reply.ok) {
    throw new Error(reply.error);
  }
  return reply.data;
}

/** How the extension's pages, the content script and the recorder send logs: via the worker. */
export function relayLogs(batch: LogBatch): Promise<unknown> {
  return askWorker({ type: 'log/batch', batch });
}
