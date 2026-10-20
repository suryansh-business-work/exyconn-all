export interface BackoffOptions {
  baseMs: number;
  maxMs: number;
}

/**
 * The wait before retry number `attempt` (1-based): doubling from `baseMs`, capped at
 * `maxMs`, and never shorter than what the server asked for with `retryAfterMs`.
 */
export function backoffDelay(attempt: number, options: BackoffOptions, retryAfterMs = 0): number {
  const exponential = Math.min(options.maxMs, options.baseMs * 2 ** Math.max(0, attempt - 1));
  return Math.max(exponential, retryAfterMs);
}
