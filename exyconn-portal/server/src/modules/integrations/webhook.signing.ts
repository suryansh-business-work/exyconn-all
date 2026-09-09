import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * How a receiver knows a delivery came from us. Pure — no network, no database — so the
 * contract a customer implements against is a table test.
 */

/** The header the signature travels in. */
export const SIGNATURE_HEADER = 'x-exyconn-signature';
/** The header carrying the moment it was signed, which is what makes a replay detectable. */
export const TIMESTAMP_HEADER = 'x-exyconn-timestamp';

/**
 * `sha256=<hex>` over `<timestamp>.<body>`.
 *
 * The timestamp is INSIDE the signed string, not beside it. Signing the body alone lets
 * anybody who once captured a delivery replay it for ever; binding the time means a receiver
 * can reject anything older than its own tolerance and the signature still proves it.
 */
export function signPayload(secret: string, timestamp: string, body: string): string {
  const digest = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return `sha256=${digest}`;
}

/**
 * Whether a presented signature is ours. Compared byte-for-byte in constant time, because a
 * comparison that returns early tells an attacker how much of a forgery was right.
 */
export function verifySignature(
  secret: string,
  timestamp: string,
  body: string,
  presented: string,
): boolean {
  const expected = Buffer.from(signPayload(secret, timestamp, body));
  const actual = Buffer.from(presented);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** How long each attempt waits, in minutes — 1, 5, 25, then two hours. */
const BACKOFF_MINUTES = [1, 5, 25, 125];

/** After this many attempts a delivery is DEAD and stops being retried. */
export const MAX_ATTEMPTS = BACKOFF_MINUTES.length;

/**
 * When to try again after `attempts` failures.
 *
 * Exponential rather than fixed: an endpoint that is down is usually down for a while, and
 * hammering it every minute makes somebody else's outage worse while filling our own log.
 */
export function nextAttemptAfter(attempts: number, from: Date = new Date()): Date {
  const minutes = BACKOFF_MINUTES[Math.min(attempts, BACKOFF_MINUTES.length - 1)];
  return new Date(from.getTime() + minutes * 60_000);
}
