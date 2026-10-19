import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { newTicketSecret, readCallTicket, signCallTicket } from '../../../src/shared/ticket';

const SECRET = 'ticket-test-secret';
const NOW = Date.UTC(2026, 9, 1, 12, 0, 0);

/** A token whose payload is `text`, signed as a genuine ticket is. */
function signedRaw(text: string): string {
  const payload = Buffer.from(text).toString('base64url');
  return `${payload}.${createHmac('sha256', SECRET).update(payload).digest('base64url')}`;
}

describe('call tickets', () => {
  it('reads back the call a ticket was signed for while it is fresh', () => {
    const token = signCallTicket(SECRET, 'call-1', 60, NOW);
    expect(readCallTicket(SECRET, token, NOW + 59_000)).toEqual({
      callId: 'call-1',
      exp: NOW + 60_000,
    });
  });

  it('measures freshness against the current time by default', () => {
    const token = signCallTicket(SECRET, 'call-1', 60);
    expect(readCallTicket(SECRET, token)?.callId).toBe('call-1');
  });

  it('refuses a ticket once it has expired, the expiry instant included', () => {
    const token = signCallTicket(SECRET, 'call-1', 60, NOW);
    expect(readCallTicket(SECRET, token, NOW + 60_000)).toBeNull();
  });

  it('refuses a ticket signed with another secret', () => {
    const token = signCallTicket('another-secret', 'call-1', 60, NOW);
    expect(readCallTicket(SECRET, token, NOW)).toBeNull();
  });

  it('refuses a ticket whose signature has the wrong length', () => {
    const [payload] = signCallTicket(SECRET, 'call-1', 60, NOW).split('.');
    expect(readCallTicket(SECRET, `${payload}.short`, NOW)).toBeNull();
  });

  it.each(['', 'onlypayload', '.signature', 'payload.', 'a.b.c'])(
    'refuses the malformed token %j',
    (token) => {
      expect(readCallTicket(SECRET, token, NOW)).toBeNull();
    },
  );

  it('refuses a correctly signed payload that is not JSON', () => {
    expect(readCallTicket(SECRET, signedRaw('not json'), NOW)).toBeNull();
  });

  it('refuses signed claims that do not name a call', () => {
    const token = signedRaw(JSON.stringify({ callId: 7, exp: NOW + 1000 }));
    expect(readCallTicket(SECRET, token, NOW)).toBeNull();
  });

  it('makes a new random base64url secret every time', () => {
    const first = newTicketSecret();
    expect(first).toMatch(/^[\w-]{43}$/);
    expect(newTicketSecret()).not.toBe(first);
  });
});
