/**
 * A fixed-window counter for the mutations anybody on the internet can call. In-memory
 * and per-process on purpose: the API runs as a single container, and the point is to
 * stop a stuck form or a bored visitor from hammering an endpoint, not to fight a botnet.
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
