/**
 * Abuse guard for the one mutation anybody on the internet can call. In-memory and
 * per-process on purpose: the API runs as a single container, and the point is to stop
 * a stuck form or a bored visitor from filling the collection, not to fight a botnet.
 */
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 10;

const recent = new Map<string, number[]>();

/** Drops timestamps that have aged out, so the map cannot grow without bound. */
function withinWindow(times: number[], now: number): number[] {
  return times.filter((time) => now - time < WINDOW_MS);
}

/**
 * Records one attempt from `client` and reports whether it is allowed. An unknown
 * client (no address on the request) shares a single bucket rather than bypassing.
 */
export function allowReport(client: string): boolean {
  const now = Date.now();
  const times = withinWindow(recent.get(client) ?? [], now);
  if (times.length >= MAX_PER_WINDOW) {
    recent.set(client, times);
    return false;
  }
  times.push(now);
  recent.set(client, times);
  return true;
}

/** Test seam: forgets every recorded attempt. */
export function resetReportLimits(): void {
  recent.clear();
}
