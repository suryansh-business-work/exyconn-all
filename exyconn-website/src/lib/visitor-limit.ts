/**
 * How many forms one visitor may send, and the window it is counted over.
 *
 * The portal limits the website as a whole (every form reaches it from this server's one
 * address), so the per-person limit has to live here, where the visitor's address is known.
 * The site runs as a single container, so an in-process count is enough; it resets on deploy,
 * which only ever gives a visitor a fresh allowance.
 */
export const VISITOR_FORM_LIMIT = { points: 5, windowMs: 10 * 60 * 1000 } as const;

/** Past this many tracked visitors the oldest are dropped, so a flood cannot grow memory. */
const MAX_TRACKED_VISITORS = 10_000;

const sent = new Map<string, number[]>();

/**
 * The visitor's address as the host nginx saw it. nginx appends the connecting address to
 * `X-Forwarded-For`, so the LAST entry is the one a client cannot forge; earlier entries are
 * whatever the client sent.
 */
export function visitorAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") ?? "";
  const hops = forwarded
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  return hops.at(-1) ?? "unknown";
}

/** Counts one form from `visitor`; false when they have already sent their allowance. */
export function allowVisitorForm(visitor: string, now = Date.now()): boolean {
  const windowStart = now - VISITOR_FORM_LIMIT.windowMs;
  const recent = (sent.get(visitor) ?? []).filter((at) => at > windowStart);
  if (recent.length >= VISITOR_FORM_LIMIT.points) {
    sent.set(visitor, recent);
    return false;
  }
  recent.push(now);
  sent.delete(visitor);
  sent.set(visitor, recent);
  if (sent.size > MAX_TRACKED_VISITORS) {
    const oldest = sent.keys().next().value;
    if (oldest !== undefined) {
      sent.delete(oldest);
    }
  }
  return true;
}

/** Test seam: forgets every visitor. */
export function resetVisitorForms(): void {
  sent.clear();
}
