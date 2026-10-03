/** Fires a tracker command and logs (never swallows) any failure. */
export function run(action: () => Promise<unknown>): void {
  action().catch((cause: unknown) => {
    console.error('Tracker action failed', cause);
  });
}

/** The sentence for a failed action — read the same way the desktop reads it. */
export { messageOf } from '@exyconn/tracker-core';
