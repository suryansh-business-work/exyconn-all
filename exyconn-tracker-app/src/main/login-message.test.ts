import { describe, expect, it } from 'vitest';
import { describeLoginFailure } from './login-message';
import { TrackerAuthError, TrackerRejectedError } from './portal-client';

describe('describeLoginFailure', () => {
  it('passes the portal’s own refusal through — it is already written for the employee', () => {
    expect(describeLoginFailure(new TrackerAuthError('Invalid email or password'))).toBe(
      'Invalid email or password',
    );
  });

  it('reads a dropped connection as offline rather than as a failed sign-in', () => {
    // `fetch` rejects with a TypeError when it cannot open the connection at all.
    expect(describeLoginFailure(new TypeError('fetch failed'))).toContain(
      'Cannot reach the portal',
    );
  });

  it('treats a 5xx as the portal being down, and says to try again later', () => {
    const message = describeLoginFailure(
      new Error('Portal request failed: HTTP 502 — Bad Gateway'),
    );
    expect(message).toContain('temporarily unavailable');
  });

  it('explains a rejected query as an out-of-date app, not as a bad password', () => {
    const message = describeLoginFailure(
      new TrackerRejectedError(
        'Portal request failed: HTTP 400 — Cannot query field "autoSyncEnabled"',
      ),
    );
    expect(message).toContain('install the latest version');
  });

  it('never leaks a status code, a stack, or the portal’s technical wording', () => {
    const message = describeLoginFailure(
      new Error('Portal request failed: HTTP 400 — Cannot query field "autoSyncEnabled"'),
    );
    expect(message).not.toMatch(/\d{3}/);
    expect(message).not.toContain('autoSyncEnabled');
    expect(message).not.toContain('HTTP');
  });

  it('falls back to one plain sentence for anything it cannot place', () => {
    expect(describeLoginFailure('boom')).toContain('Sign in failed');
    expect(describeLoginFailure(new Error('Portal returned no data.'))).toContain('Sign in failed');
  });
});
