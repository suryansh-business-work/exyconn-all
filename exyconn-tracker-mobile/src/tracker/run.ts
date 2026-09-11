/** Fires a tracker command and logs (never swallows) any failure. */
export function run(action: () => Promise<unknown>): void {
  action().catch((cause: unknown) => {
    console.error('Tracker action failed', cause);
  });
}

/** The sentence to show for a failed action — the error's own words, or a plain fallback. */
export function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message !== '' ? cause.message : fallback;
}
