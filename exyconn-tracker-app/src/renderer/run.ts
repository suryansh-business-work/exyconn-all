/** Fire a tracker command and log (never swallow) any failure. */
export function run(action: () => Promise<unknown>): void {
  action().catch((cause: unknown) => {
    console.error('Tracker action failed', cause);
  });
}
