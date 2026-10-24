import { describe, expect, it, vi } from 'vitest';
import { createAuth, type AuthOptions } from '../../../src/services/auth';
import { createTokenStore } from '../../../src/storage/tokens';
import { MemoryArea, jsonResponse } from '../chrome-mock';

const NOW = 1_000_000;
const tokens = (n: number) => ({
  access_token: `access-${n}`,
  token_type: 'Bearer',
  expires_in: 900,
  refresh_token: `refresh-${n}`,
  refresh_expires_in: 86_400,
});

function setup(...responses: Array<Response | Error>) {
  const fetchImpl = vi.fn<AuthOptions['fetchImpl']>();
  for (const response of responses) {
    if (response instanceof Error) {
      fetchImpl.mockRejectedValueOnce(response);
    } else {
      fetchImpl.mockResolvedValueOnce(response);
    }
  }
  const store = createTokenStore(new MemoryArea(), new MemoryArea());
  const now = vi.fn(() => NOW);
  const auth = createAuth({
    apiUrl: 'https://api.test',
    fetchImpl,
    store,
    extensionId: 'ext',
    extensionVersion: '1.0.0',
    now,
  });
  const body = (call: number) =>
    JSON.parse(String(fetchImpl.mock.calls[call][1].body)) as Record<string, unknown>;
  return { auth, fetchImpl, store, now, body };
}

const PASSWORD = `pw-${NOW}`;
const credentials = {
  email: 'ravi@exyconn.com',
  password: PASSWORD,
  deviceLabel: 'Chrome on mac',
  remember: true,
};

async function signedIn(...responses: Array<Response | Error>) {
  const context = setup(jsonResponse(200, tokens(1)), ...responses);
  await context.auth.signInWithPassword(credentials);
  return context;
}

describe('password sign-in', () => {
  it('posts the email and password and stores both tokens with their expiry', async () => {
    const { auth, store, body, fetchImpl } = await signedIn();
    expect(fetchImpl.mock.calls[0][0]).toBe('https://api.test/meet-assistant/auth/token');
    expect(body(0)).toEqual({
      grant_type: 'password',
      email: 'ravi@exyconn.com',
      password: PASSWORD,
      device_label: 'Chrome on mac',
      extension_id: 'ext',
      extension_version: '1.0.0',
    });
    await expect(store.readAccess()).resolves.toEqual({
      token: 'access-1',
      expiresAt: NOW + 900_000,
    });
    await expect(auth.getAccessToken()).resolves.toBe('access-1');
    await expect(auth.isSignedIn()).resolves.toBe(true);
  });

  it('hands back the two-factor challenge, storing nothing, then signs in with the code', async () => {
    const { auth, store, body } = setup(
      jsonResponse(200, { mfa_required: true, mfa_challenge: 'c1' }),
      jsonResponse(200, tokens(1)),
    );
    await expect(auth.signInWithPassword(credentials)).resolves.toEqual({ mfaChallenge: 'c1' });
    await expect(store.readAccess()).resolves.toBeNull();

    await expect(
      auth.completeSecondFactor({
        challenge: 'c1',
        code: '123456',
        deviceLabel: 'Chrome on mac',
        remember: false,
      }),
    ).resolves.toEqual({ mfaChallenge: null });
    expect(await store.readRefresh()).toMatchObject({ remembered: false });
    expect(body(1)).toEqual({
      grant_type: 'mfa',
      mfa_challenge: 'c1',
      code: '123456',
      device_label: 'Chrome on mac',
      extension_id: 'ext',
      extension_version: '1.0.0',
    });
    await expect(auth.isSignedIn()).resolves.toBe(true);
  });

  it("rejects with the portal's own words, or a plain refusal, or a malformed answer", async () => {
    const refused = setup(
      jsonResponse(401, { error: 'invalid_grant', error_description: 'Invalid email or password' }),
    );
    await expect(refused.auth.signInWithPassword(credentials)).rejects.toMatchObject({
      code: 'invalid_grant',
      message: 'Invalid email or password',
    });
    const odd = setup(jsonResponse(500, 'down'));
    await expect(odd.auth.signInWithPassword(credentials)).rejects.toMatchObject({
      code: 'server_error',
      message: 'The sign-in was refused',
    });
    const malformed = setup(jsonResponse(200, { access_token: 'a', mfa_required: 'yes' }));
    await expect(malformed.auth.signInWithPassword(credentials)).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });
});

describe('refresh', () => {
  it('refreshes an expired access token and stores the ROTATED refresh token', async () => {
    const { auth, now, store, body } = await signedIn(jsonResponse(200, tokens(2)));
    now.mockReturnValue(NOW + 900_000);
    await expect(auth.getAccessToken()).resolves.toBe('access-2');
    expect(body(1)).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'refresh-1' });
    expect((await store.readRefresh())?.token).toBe('refresh-2');
  });

  it('keeps a sign-in that was not remembered for this browser session only', async () => {
    const { auth, now, store } = setup(jsonResponse(200, tokens(1)), jsonResponse(200, tokens(2)));
    await auth.signInWithPassword({ ...credentials, remember: false });
    now.mockReturnValue(NOW + 900_000);
    await auth.getAccessToken();
    expect(await store.readRefresh()).toMatchObject({ token: 'refresh-2', remembered: false });
  });

  it('serialises concurrent refreshes into ONE exchange', async () => {
    const { auth, fetchImpl, now } = await signedIn(jsonResponse(200, tokens(2)));
    now.mockReturnValue(NOW + 900_000);
    const results = await Promise.all([
      auth.getAccessToken(),
      auth.refresh(),
      auth.getAccessToken(),
    ]);
    expect(results).toEqual(['access-2', 'access-2', 'access-2']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('starts a new exchange once the previous one finished', async () => {
    const { auth, fetchImpl, body } = await signedIn(
      jsonResponse(200, tokens(2)),
      jsonResponse(200, tokens(3)),
    );
    await auth.refresh();
    await auth.refresh();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(body(2)).toMatchObject({ refresh_token: 'refresh-2' });
  });

  it('signs out on invalid_grant', async () => {
    const { auth, store } = await signedIn(
      jsonResponse(400, { error: 'invalid_grant', error_description: 'reused' }),
    );
    await expect(auth.refresh()).resolves.toBeNull();
    await expect(store.readRefresh()).resolves.toBeNull();
    await expect(auth.isSignedIn()).resolves.toBe(false);
  });

  it('keeps the sign-in through a network failure', async () => {
    const { auth, store } = await signedIn(new TypeError('offline'));
    await expect(auth.refresh()).rejects.toMatchObject({ code: 'NETWORK' });
    expect((await store.readRefresh())?.token).toBe('refresh-1');
  });

  it('signs out when the refresh token itself has expired', async () => {
    const { auth, fetchImpl, now } = await signedIn();
    now.mockReturnValue(NOW + 86_400_000);
    await expect(auth.getAccessToken()).resolves.toBeNull();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('returns null when never signed in', async () => {
    await expect(setup().auth.getAccessToken()).resolves.toBeNull();
  });
});

describe('sign-out', () => {
  it('revokes the refresh token and forgets both tokens', async () => {
    const { auth, store, body, fetchImpl } = await signedIn(jsonResponse(204, null));
    await expect(auth.signOut()).resolves.toBe(true);
    expect(fetchImpl.mock.calls[1][0]).toBe('https://api.test/meet-assistant/auth/revoke');
    expect(body(1)).toEqual({ refresh_token: 'refresh-1' });
    await expect(store.readAccess()).resolves.toBeNull();
  });

  it('signs out locally even when the revoke fails', async () => {
    const offline = await signedIn(new TypeError('offline'));
    await expect(offline.auth.signOut()).resolves.toBe(false);
    await expect(offline.auth.isSignedIn()).resolves.toBe(false);
    const refused = await signedIn(jsonResponse(500, {}));
    await expect(refused.auth.signOut()).resolves.toBe(false);
  });

  it('needs no server call when already signed out', async () => {
    const { auth, fetchImpl } = setup();
    await expect(auth.signOut()).resolves.toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
