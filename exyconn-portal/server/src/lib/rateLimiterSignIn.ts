import { GraphQLError } from 'graphql';
import { createLimiter, tooManyRequests } from './rateLimiter';

/**
 * Brute-force protection shared by the portal sign-in and the tracker sign-in.
 *
 * Only FAILURES are counted, on two keys at once:
 *   - the address being tried — 10 wrong passwords in 15 minutes locks that account's
 *     sign-in for 15 minutes, however many machines the guesses come from;
 *   - the caller's IP — 20 failures in 15 minutes stops one machine spraying guesses across
 *     many addresses.
 * A successful sign-in forgives the address's count (the earlier failures were typos). The IP
 * count is deliberately NOT forgiven: an attacker holding one real account could otherwise
 * reset their own counter between every guess at somebody else's.
 */
const WINDOW_SEC = 15 * 60;

const addressLimiter = createLimiter({
  keyPrefix: 'signin_address',
  points: 10,
  durationSec: WINDOW_SEC,
  blockDurationSec: WINDOW_SEC,
});

const ipLimiter = createLimiter({
  keyPrefix: 'signin_ip',
  points: 20,
  durationSec: WINDOW_SEC,
  blockDurationSec: WINDOW_SEC,
});

/** Longer than any real address (RFC 5321); used as a key, so it must stay bounded. */
export const MAX_EMAIL_LENGTH = 254;

/** The one form an address is counted under, whatever case or padding it was typed with. */
export function signInAddress(email: string): string {
  return email.trim().toLowerCase().slice(0, MAX_EMAIL_LENGTH);
}

/** Refuses the attempt before any password work is done when either key is locked out. */
export async function assertSignInAllowed(address: string, ip: string): Promise<void> {
  const [addressWait, ipWait] = await Promise.all([
    addressLimiter.retryAfterMs(address),
    ipLimiter.retryAfterMs(ip),
  ]);
  const wait = Math.max(addressWait, ipWait);
  if (wait > 0) {
    tooManyRequests(wait, 'sign-in attempts');
  }
}

/** Counts one wrong password (or unknown address) against both keys. */
export async function recordSignInFailure(address: string, ip: string): Promise<void> {
  await Promise.all([addressLimiter.fail(address), ipLimiter.fail(ip)]);
}

/** A correct password: the address's earlier failures are forgiven. */
export async function recordSignInSuccess(address: string): Promise<void> {
  await addressLimiter.forgive(address);
}

/** Test seam: forgets every sign-in failure. */
export async function resetSignInLimits(): Promise<void> {
  await Promise.all([addressLimiter.reset(), ipLimiter.reset()]);
}

/**
 * Sign-ins already attempted in each request. Keyed by the request's context object, so the
 * entry disappears with the request.
 */
const signInsPerRequest = new WeakMap<object, number>();

/**
 * Refuses a second sign-in field in one GraphQL request.
 *
 * Aliases let one HTTP request carry hundreds of `login` fields, each a separate password
 * guess — which would make the limits above count a whole batch as one request's worth of
 * work before the first failure landed. One sign-in per request is all any client needs.
 */
export function assertSingleSignIn(ctx: object): void {
  const seen = signInsPerRequest.get(ctx) ?? 0;
  signInsPerRequest.set(ctx, seen + 1);
  if (seen > 0) {
    throw new GraphQLError('Only one sign-in is allowed per request.', {
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
  }
}
