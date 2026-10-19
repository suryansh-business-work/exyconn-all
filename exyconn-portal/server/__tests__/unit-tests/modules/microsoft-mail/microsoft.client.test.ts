import { seal } from '../../../../src/utils/secretBox';
import {
  MICROSOFT_SCOPES,
  MicrosoftAuthError,
  graph,
  mailboxAddress,
  microsoftApp,
  microsoftAuthorizeUrl,
  refreshMailbox,
  requestTokens,
} from '../../../../src/modules/microsoft-mail/microsoft.client';
import { APP_SECRET, saveApp } from './fakeMicrosoft';

const APP = { clientId: 'ms-client-id', clientSecret: APP_SECRET, tenant: 'contoso.com' };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
/** Answers the next fetch with `response` and hands back the spy, to read what was sent. */
const answer = (response: Response) =>
  jest.spyOn(globalThis, 'fetch').mockResolvedValueOnce(response);
const sentInit = (spy: jest.SpyInstance) => spy.mock.calls[0][1] as RequestInit;

afterEach(() => {
  jest.restoreAllMocks();
});

describe('microsoftApp', () => {
  it('is the saved app once it is turned on with an id and a secret', async () => {
    await saveApp();

    await expect(microsoftApp()).resolves.toMatchObject({
      clientId: 'ms-client-id',
      clientSecret: APP_SECRET,
    });
  });

  it.each([
    ['never saved', null],
    ['turned off', { enabled: false }],
    ['without a client id', { clientId: '' }],
    ['without a secret', { clientSecret: '' }],
  ])('says what Tech still has to do when the app is %s', async (_case, fields) => {
    if (fields) {
      await saveApp(fields);
    }

    await expect(microsoftApp()).rejects.toThrow('Microsoft mail is not set up.');
  });
});

describe('microsoftAuthorizeUrl', () => {
  it('signs in against the app tenant, or common when it has none', () => {
    expect(microsoftAuthorizeUrl({ ...APP, tenant: 'a b' })).toBe(
      'https://login.microsoftonline.com/a%20b/oauth2/v2.0/authorize',
    );
    expect(microsoftAuthorizeUrl({ ...APP, tenant: '' })).toBe(
      'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    );
  });
});

describe('requestTokens', () => {
  it("posts the grant with the app's credentials and scopes, and keeps only the tokens", async () => {
    const fetchSpy = answer(json({ access_token: 'at', refresh_token: 'rt', expires_in: 3600 }));

    const tokens = await requestTokens(APP, { grant_type: 'authorization_code', code: 'c1' });

    expect(tokens).toEqual({ access_token: 'at', refresh_token: 'rt' });
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://login.microsoftonline.com/contoso.com/oauth2/v2.0/token',
    );
    const form = Object.fromEntries(sentInit(fetchSpy).body as URLSearchParams);
    expect(form).toEqual({
      client_id: 'ms-client-id',
      client_secret: APP_SECRET,
      scope: MICROSOFT_SCOPES,
      grant_type: 'authorization_code',
      code: 'c1',
    });
  });

  it('calls a revoked connection an auth error, so the mailbox asks for a reconnect', async () => {
    answer(json({ error: 'invalid_grant', error_description: 'AADSTS70000' }, 400));

    const refused = requestTokens(APP, { grant_type: 'refresh_token' });

    await expect(refused).rejects.toBeInstanceOf(MicrosoftAuthError);
    await expect(refused).rejects.toThrow('Microsoft refused the stored connection.');
  });

  it("gives the first line of Microsoft's description, which is the readable part", async () => {
    answer(
      json(
        {
          error: 'invalid_client',
          error_description: 'AADSTS7000215: Invalid client secret.\r\nTrace ID: 1\r\nTimestamp: x',
        },
        401,
      ),
    );

    await expect(requestTokens(APP, {})).rejects.toThrow(
      new Error('Microsoft refused: AADSTS7000215: Invalid client secret.'),
    );
  });

  it('falls back to the error code, then to no reason at all', async () => {
    answer(json({ error: 'temporarily_unavailable' }, 503));
    await expect(requestTokens(APP, {})).rejects.toThrow('Microsoft refused: temporarily_unavailable');

    answer(json({ refresh_token: 'rt' }));
    await expect(requestTokens(APP, {})).rejects.toThrow('Microsoft refused: no reason');
  });

  it('refuses an error status even when a token came back', async () => {
    answer(json({ access_token: 'at', error_description: 'Odd answer' }, 500));

    await expect(requestTokens(APP, {})).rejects.toThrow('Microsoft refused: Odd answer');
  });
});

describe('refreshMailbox', () => {
  it('trades the opened refresh token for a fresh access token', async () => {
    const fetchSpy = answer(json({ access_token: 'at' }));

    await expect(
      refreshMailbox({ ...APP, id: 'm1', email: 'a@x.test', refreshToken: seal('rt-secret') }),
    ).resolves.toEqual({ access_token: 'at', refresh_token: undefined });

    const form = Object.fromEntries(sentInit(fetchSpy).body as URLSearchParams);
    expect(form).toMatchObject({ grant_type: 'refresh_token', refresh_token: 'rt-secret' });
  });
});

describe('graph', () => {
  it('calls Graph with the bearer token, keeping the caller headers', async () => {
    const fetchSpy = answer(json({ value: 1 }));

    const body = await graph<{ value: number }>('at-1', '/me/messages', {
      method: 'GET',
      headers: { Prefer: 'IdType="ImmutableId"' },
    });

    expect(body).toEqual({ value: 1 });
    expect(fetchSpy.mock.calls[0][0]).toBe('https://graph.microsoft.com/v1.0/me/messages');
    expect(sentInit(fetchSpy)).toMatchObject({
      method: 'GET',
      headers: {
        Authorization: 'Bearer at-1',
        'Content-Type': 'application/json',
        Prefer: 'IdType="ImmutableId"',
      },
    });
  });

  it('answers null for an accepted call with no body (sendMail)', async () => {
    answer(new Response(null, { status: 202 }));

    await expect(graph('at-1', '/me/sendMail', { method: 'POST' })).resolves.toBeNull();
  });

  it('calls a 401 an auth error, and names the path without its query', async () => {
    answer(new Response('InvalidAuthenticationToken', { status: 401 }));

    const refused = graph('at-1', '/me?$select=mail');

    await expect(refused).rejects.toBeInstanceOf(MicrosoftAuthError);
    await expect(refused).rejects.toThrow(
      'Microsoft Graph /me failed (401): InvalidAuthenticationToken',
    );
  });

  it('throws a plain error for other refusals, with at most 300 characters of detail', async () => {
    answer(new Response('x'.repeat(400), { status: 500 }));

    const refused = graph('at-1', '/me/sendMail');

    await expect(refused).rejects.not.toBeInstanceOf(MicrosoftAuthError);
    await expect(refused).rejects.toThrow(
      new Error(`Microsoft Graph /me/sendMail failed (500): ${'x'.repeat(300)}`),
    );
  });
});

describe('mailboxAddress', () => {
  it('is the primary SMTP address, lower-cased', async () => {
    const fetchSpy = answer(json({ mail: ' Sales@Contoso.com ', userPrincipalName: 'x@y.z' }));

    await expect(mailboxAddress('at-1')).resolves.toBe('sales@contoso.com');
    expect(fetchSpy.mock.calls[0][0]).toBe(
      'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',
    );
  });

  it('falls back to the sign-in name when the mailbox has no SMTP address', async () => {
    answer(json({ mail: null, userPrincipalName: 'Ravi@Contoso.onmicrosoft.com' }));

    await expect(mailboxAddress('at-1')).resolves.toBe('ravi@contoso.onmicrosoft.com');
  });

  it('refuses an answer that names no mailbox', async () => {
    answer(json({}));
    await expect(mailboxAddress('at-1')).rejects.toThrow('Microsoft did not say which mailbox');

    answer(json({ userPrincipalName: 'not-an-address' }));
    await expect(mailboxAddress('at-1')).rejects.toThrow('Microsoft did not say which mailbox');
  });
});
