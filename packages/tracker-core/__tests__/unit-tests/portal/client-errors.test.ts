import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPortalClient } from '../../../src/portal/client';
import { TrackerAuthError, TrackerRejectedError } from '../../../src/portal/portal-error';
import { PORTAL_URL, clientWith, nextToken, respond, respondRaw, sent } from './portal-fixture';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('portal client — failed HTTP responses', () => {
  it.each([400, 404, 413, 422])('treats HTTP %i as a permanent rejection', async (status) => {
    respond(status, { errors: [{ message: 'nope' }] });
    const failure = clientWith(nextToken()).fetchMyTotals();
    await expect(failure).rejects.toBeInstanceOf(TrackerRejectedError);
    await expect(failure).rejects.toThrow(`Portal request failed: HTTP ${status} — nope`);
  });

  it('keeps other statuses retryable, as a plain Error', async () => {
    respond(500, { errors: [{ message: 'boom' }, { message: 'again' }] });
    const failure = clientWith(nextToken()).fetchMyTotals();
    await expect(failure).rejects.not.toBeInstanceOf(TrackerRejectedError);
    await expect(failure).rejects.toThrow('HTTP 500 — boom; again');
  });

  it('falls back to the status text when the body names no errors', async () => {
    respond(502, {}, 'Bad Gateway');
    await expect(clientWith(nextToken()).fetchMyTotals()).rejects.toThrow('HTTP 502 — Bad Gateway');
  });

  it('falls back to the status text when the error list is empty', async () => {
    respond(503, { errors: [] }, 'Service Unavailable');
    await expect(clientWith(nextToken()).fetchMyTotals()).rejects.toThrow(
      'HTTP 503 — Service Unavailable',
    );
  });

  it('falls back to the status text when the body is not JSON', async () => {
    respondRaw(504, '<html>gateway timeout</html>', 'Gateway Timeout');
    await expect(clientWith(nextToken()).fetchMyTotals()).rejects.toThrow(
      'HTTP 504 — Gateway Timeout',
    );
  });
});

describe('portal client — GraphQL errors on a 200', () => {
  it('reads FORBIDDEN as an auth failure, ahead of any rejection in the same payload', async () => {
    respond(200, {
      errors: [
        { message: 'bad input', extensions: { code: 'BAD_USER_INPUT' } },
        { message: 'Access revoked', extensions: { code: 'FORBIDDEN' } },
      ],
    });
    const failure = clientWith(nextToken()).trackerMe();
    await expect(failure).rejects.toBeInstanceOf(TrackerAuthError);
    await expect(failure).rejects.toThrow('Access revoked');
  });

  it.each(['NOT_FOUND', 'GRAPHQL_VALIDATION_FAILED'])(
    'reads %s as a permanent rejection',
    async (code) => {
      respond(200, { errors: [{ message: 'Session missing', extensions: { code } }] });
      const failure = clientWith(nextToken()).stopSession('s-1', '2026-01-01T00:00:00.000Z');
      await expect(failure).rejects.toBeInstanceOf(TrackerRejectedError);
      await expect(failure).rejects.toThrow('Session missing');
    },
  );

  it('joins unclassified errors (with or without a code) into one retryable Error', async () => {
    respond(200, {
      errors: [{ message: 'first' }, { message: 'second', extensions: { code: 'INTERNAL' } }],
    });
    const failure = clientWith(nextToken()).fetchMyTotals();
    await expect(failure).rejects.not.toBeInstanceOf(TrackerAuthError);
    await expect(failure).rejects.not.toBeInstanceOf(TrackerRejectedError);
    await expect(failure).rejects.toThrow('first; second');
  });

  it('refuses a 200 that carries neither data nor errors', async () => {
    respond(200, {});
    await expect(clientWith(nextToken()).fetchMyTotals()).rejects.toThrow(
      'Portal returned no data.',
    );
  });

  it('treats an empty error list as success when data is present', async () => {
    respond(200, { errors: [], data: { trackerTimezones: ['UTC'] } });
    await expect(clientWith(nextToken()).fetchTimezones()).resolves.toEqual(['UTC']);
  });
});

describe('portal client — tokens', () => {
  it('awaits an asynchronous token reader before an authenticated call', async () => {
    const token = nextToken();
    respond(200, { data: { trackerTimezones: [] } });
    const client = createPortalClient({ url: PORTAL_URL, getToken: () => Promise.resolve(token) });

    await client.fetchTimezones();

    expect(sent().authorization).toBe(`Bearer ${token}`);
  });

  it('treats an empty stored token as signed out', async () => {
    respond(200, {});
    const failure = clientWith('').fetchTimezones();
    await expect(failure).rejects.toBeInstanceOf(TrackerAuthError);
    await expect(failure).rejects.toThrow('Not signed in.');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('posts JSON to the configured endpoint', async () => {
    respond(200, { data: { trackerTimezones: [] } });
    await clientWith(nextToken()).fetchTimezones();

    const [, init] = vi.mocked(fetch).mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
    expect(sent().url).toBe(PORTAL_URL);
  });
});
