import { describe, expect, it } from 'vitest';
import { classifyFailure, describeSyncFailure } from '../../../src/portal/sync-message';
import { TrackerAuthError, TrackerRejectedError } from '../../../src/portal/portal-error';

describe('describeSyncFailure — rejections and refused devices', () => {
  it('says skipped work was refused, and that the rest went up', () => {
    const message = describeSyncFailure(
      new TrackerRejectedError('Portal request failed: HTTP 404 — Session missing'),
    );
    expect(message).toBe(
      'The portal refused some saved work, so it was skipped. Everything else was uploaded.',
    );
  });

  it.each([401, 403])('asks the employee to sign in again on HTTP %i', (status) => {
    expect(describeSyncFailure(new Error(`Portal request failed: HTTP ${status}`))).toBe(
      'The portal would not accept this device. Sign out and sign in again.',
    );
  });

  it('promises a retry for any other 4xx', () => {
    expect(describeSyncFailure(new Error('Portal request failed: HTTP 429'))).toBe(
      'The portal rejected the upload. Your work is saved and will be retried.',
    );
  });

  it('treats exactly 500 as the portal being down', () => {
    expect(describeSyncFailure(new Error('Portal request failed: HTTP 500'))).toContain(
      'temporarily unavailable',
    );
  });
});

describe('classifyFailure', () => {
  it('drops a rejection retrying can never fix', () => {
    expect(classifyFailure(new TrackerRejectedError('too large'))).toBe('drop');
  });

  it('retries everything else, including auth failures and non-errors', () => {
    expect(classifyFailure(new TrackerAuthError('revoked'))).toBe('retry');
    expect(classifyFailure(new TypeError('fetch failed'))).toBe('retry');
    expect(classifyFailure(new Error('HTTP 503'))).toBe('retry');
    expect(classifyFailure('boom')).toBe('retry');
  });
});
