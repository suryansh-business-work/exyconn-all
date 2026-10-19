import {
  authorizeUrl,
  exchangeCode,
  exchangeForTokens,
  GOOGLE_CALLBACK_PATH,
  googleRedirectUri,
  randomToken,
  sha256,
  TOKEN_URL,
  verifiedEmailOf,
} from '../../../../../src/modules/auth/google/google-sign-in.oauth';
import { env } from '../../../../../src/config/env';
import { CLIENT_ID, credential, goodClaims, idTokenWith, jsonResponse } from './googleSignIn.fixtures';

const client = { clientId: CLIENT_ID, clientSecret: credential('google') };

afterEach(() => jest.restoreAllMocks());

describe('tokens and addresses', () => {
  it('makes URL-safe random tokens of the asked size', () => {
    const token = randomToken(24);
    expect(token).toMatch(/^[\w-]{32}$/);
    expect(randomToken(24)).not.toBe(token);
  });

  it('hashes to base64url SHA-256 (the PKCE S256 challenge)', () => {
    expect(sha256('abc')).toBe('ungWv48Bz-pBQUDeXa4iI7ADYaOWF3qctBD_YfIAFa0');
  });

  it('sends Google back to the API’s callback', () => {
    expect(googleRedirectUri()).toBe(`${env.apiPublicUrl}${GOOGLE_CALLBACK_PATH}/callback`);
  });

  it('builds the consent URL asking only for the email, with state and PKCE', () => {
    const url = new URL(authorizeUrl(CLIENT_ID, 'nonce-1', 'verifier-1'));
    expect(`${url.origin}${url.pathname}`).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      client_id: CLIENT_ID,
      redirect_uri: googleRedirectUri(),
      response_type: 'code',
      scope: 'openid email',
      state: 'nonce-1',
      code_challenge: sha256('verifier-1'),
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
  });
});

describe('exchangeForTokens / exchangeCode', () => {
  it('trades the code with the secret and verifier, returning Google’s tokens', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ id_token: 'id', access_token: 'at', expires_in: 3599 }));
    await expect(
      exchangeForTokens(client, 'code-1', 'verifier-1', 'https://api.example/cb'),
    ).resolves.toEqual({ id_token: 'id', access_token: 'at', expires_in: 3599 });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(TOKEN_URL);
    expect(init.method).toBe('POST');
    expect(Object.fromEntries(new URLSearchParams(String(init.body)))).toEqual({
      client_id: CLIENT_ID,
      client_secret: credential('google'),
      code: 'code-1',
      code_verifier: 'verifier-1',
      grant_type: 'authorization_code',
      redirect_uri: 'https://api.example/cb',
    });
  });

  it('throws with Google’s reason and description', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        jsonResponse({ error: 'invalid_grant', error_description: 'Bad Request' }, 400),
      );
    await expect(exchangeForTokens(client, 'c', 'v', 'r')).rejects.toThrow(
      'Google refused: invalid_grant Bad Request',
    );
  });

  it('says "no reason" when Google gives none', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 500));
    const error = await exchangeForTokens(client, 'c', 'v', 'r').catch((e: Error) => e);
    expect((error as Error).message).toBe('Google refused: no reason');
  });

  it('exchangeCode returns the ID token, using the callback address by default', async () => {
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse({ id_token: 'the-id-token' }));
    await expect(exchangeCode(client, 'c', 'v')).resolves.toBe('the-id-token');
    const body = new URLSearchParams(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.get('redirect_uri')).toBe(googleRedirectUri());
  });

  it('exchangeCode refuses an answer without an ID token', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({ access_token: 'at' }));
    await expect(exchangeCode(client, 'c', 'v', 'r')).rejects.toThrow(
      'Google refused the sign-in: no ID token',
    );
  });
});

describe('verifiedEmailOf', () => {
  const NOT_FOR_US = 'Google’s answer was not meant for this portal.';

  it('returns the verified email of a token meant for this client', () => {
    expect(verifiedEmailOf(idTokenWith(goodClaims('a@x.io')), CLIENT_ID)).toBe('a@x.io');
    const bareIssuer = { ...goodClaims('b@x.io'), iss: 'accounts.google.com' };
    expect(verifiedEmailOf(idTokenWith(bareIssuer), CLIENT_ID)).toBe('b@x.io');
  });

  it.each([
    ['another issuer', { iss: 'https://evil.example' }],
    ['no issuer', { iss: undefined }],
    ['another client', { aud: 'someone-else' }],
    ['an expired token', { exp: Math.floor(Date.now() / 1000) - 1 }],
    ['no expiry', { exp: undefined }],
  ])('refuses %s', (_label, change) => {
    const token = idTokenWith({ ...goodClaims('a@x.io'), ...change });
    expect(() => verifiedEmailOf(token, CLIENT_ID)).toThrow(NOT_FOR_US);
  });

  it.each([
    ['no email', { email: undefined }],
    ['an unverified email', { email_verified: false }],
  ])('refuses %s', (_label, change) => {
    const token = idTokenWith({ ...goodClaims('a@x.io'), ...change });
    expect(() => verifiedEmailOf(token, CLIENT_ID)).toThrow(
      'Google has not verified that email address.',
    );
  });

  it('refuses a token with no claims part', () => {
    expect(() => verifiedEmailOf('not-a-jwt', CLIENT_ID)).toThrow(SyntaxError);
  });
});
