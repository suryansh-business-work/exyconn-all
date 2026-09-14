import { describe, expect, it } from 'vitest';
import { describeSyncFailure } from '../../src/portal/sync-message';
import { TrackerAuthError } from '../../src/portal/portal-error';

describe('describeSyncFailure', () => {
  it('tells a revoked employee to ask for access back, not to retry forever', () => {
    const message = describeSyncFailure(new TrackerAuthError('device revoked'));
    expect(message).toContain('tracker access was removed');
    expect(message).not.toContain('device revoked');
  });

  it('reads a dropped connection as offline, and promises the work is kept', () => {
    // `fetch` rejects with a TypeError when it cannot open the connection at all.
    const message = describeSyncFailure(new TypeError('fetch failed'));
    expect(message).toContain('Cannot reach the portal');
    expect(message).toContain('will upload');
  });

  it('treats a 5xx as the portal being down, not the employee doing something wrong', () => {
    const message = describeSyncFailure(new Error('Portal request failed: HTTP 503'));
    expect(message).toContain('temporarily unavailable');
  });

  it('explains an oversized screenshot in terms of the setting that causes it', () => {
    const message = describeSyncFailure(new Error('Portal request failed: HTTP 413'));
    expect(message).toContain('too large');
    expect(message).toContain('screenshot quality');
  });

  it('never leaks a raw status code to the employee', () => {
    const message = describeSyncFailure(new Error('Portal request failed: HTTP 422'));
    expect(message).not.toMatch(/\d{3}/);
  });

  it("never shows a runtime fault's own message to the employee", () => {
    // A dropped socket or a parse failure says nothing somebody at a tracker can act on,
    // and it is the one string here nobody wrote — so no catalogue could translate it.
    const message = describeSyncFailure(new Error('ECONNRESET at socket.js:123'));
    expect(message).not.toContain('ECONNRESET');
    expect(message).toContain('unknown reason');
  });

  it('falls back to a sentence when something that is not an Error is thrown', () => {
    expect(describeSyncFailure('boom')).toContain('unknown reason');
  });
});
