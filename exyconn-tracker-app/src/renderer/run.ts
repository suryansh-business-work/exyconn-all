import { messageOf as sentenceOf } from '@exyconn/tracker-core';

/** Fire a tracker command and log (never swallow) any failure. */
export function run(action: () => Promise<unknown>): void {
  action().catch((cause: unknown) => {
    console.error('Tracker action failed', cause);
  });
}

/** What Electron wraps round an error thrown in the main process on its way back over IPC. */
const IPC_WRAPPER = /^Error invoking remote method '[^']*': (?:\w*Error: )?/;

/**
 * The sentence to show for a failed tracker command — the controller's own words without
 * Electron's "Error invoking remote method …" wrapper, or the fallback when there are none.
 */
export function messageOf(cause: unknown, fallback: string): string {
  const message = sentenceOf(cause, fallback).replace(IPC_WRAPPER, '');
  return message === '' ? fallback : message;
}
