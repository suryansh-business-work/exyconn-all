import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * A call ticket: proof, from the portal server to the voice server, that a call was asked for
 * by somebody allowed to make it. `<payload>.<signature>`, both base64url; the payload names the
 * call and when the ticket stops being accepted. Signed with the active config's ticketSecret,
 * which both servers read from the database, so no secret has to be shared another way.
 */
export interface CallTicket {
  callId: string;
  /** Unix milliseconds after which the ticket is refused. */
  exp: number;
}

const sign = (secret: string, payload: string): string =>
  createHmac('sha256', secret).update(payload).digest('base64url');

/** A new random ticket secret, for a config being created. */
export const newTicketSecret = (): string => randomBytes(32).toString('base64url');

/** A ticket for one call, good for `ttlSeconds`. */
export function signCallTicket(
  secret: string,
  callId: string,
  ttlSeconds: number,
  now = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({ callId, exp: now + ttlSeconds * 1000 } satisfies CallTicket),
  ).toString('base64url');
  return `${payload}.${sign(secret, payload)}`;
}

/** The ticket's claims, or null when it is malformed, forged or expired. */
export function readCallTicket(secret: string, token: string, now = Date.now()): CallTicket | null {
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) {
    return null;
  }
  const expected = Buffer.from(sign(secret, payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) {
    return null;
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as CallTicket;
    return typeof claims.callId === 'string' && claims.exp > now ? claims : null;
  } catch {
    return null;
  }
}
