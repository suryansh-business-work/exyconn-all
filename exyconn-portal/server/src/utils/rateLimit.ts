/**
 * A fixed-window counter for the mutations anybody on the internet can call. In-memory
 * and per-process.
 *
 * @deprecated Use `createLimiter` from lib/rateLimiter, which is shared across restarts and
 * instances and cannot grow the process's memory. Its `allow` is async, so a caller must
 * `await` it — `if (!limiter.allow(key))` on a promise would never refuse anything. Kept only
 * for logs.ingest.ts until it moves over.
 */
export interface RateLimiter {
  /** Records one attempt for `key` and reports whether it is within the limit. */
  allow(key: string): boolean;
  /** Test seam: forgets every recorded attempt. */
  reset(): void;
}

export function createRateLimiter(windowMs: number, maxPerWindow: number): RateLimiter {
  const recent = new Map<string, number[]>();
  return {
    allow(key) {
      const now = Date.now();
      // Drop aged-out timestamps so the map cannot grow without bound.
      const times = (recent.get(key) ?? []).filter((time) => now - time < windowMs);
      const allowed = times.length < maxPerWindow;
      if (allowed) {
        times.push(now);
      }
      recent.set(key, times);
      return allowed;
    },
    reset() {
      recent.clear();
    },
  };
}
