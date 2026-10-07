import { PROVIDERS } from '../../../../src/modules/social-accounts/social.providers';
import { credentials, fakeFetch, formOf } from './social.fixtures';

const CALLBACK = 'https://api.exyconn.com/oauth/social/cb';
const tokens = (accessToken = 'user-token') => ({
  accessToken,
  refreshToken: '',
  expiresInSeconds: null,
});
const paramsOf = (consent: string) => Object.fromEntries(new URL(consent).searchParams);

afterEach(() => jest.restoreAllMocks());

describe('LinkedIn provider', () => {
  it('asks for consent with the member posting scope', () => {
    const app = credentials();
    const consent = PROVIDERS.LINKEDIN.authorizeUrl(app, CALLBACK, 'state-1', 'unused');
    expect(consent.startsWith('https://www.linkedin.com/oauth/v2/authorization?')).toBe(true);
    expect(paramsOf(consent)).toEqual({
      response_type: 'code',
      client_id: app.clientId,
      redirect_uri: CALLBACK,
      state: 'state-1',
      scope: 'openid profile w_member_social',
    });
  });

  it('swaps the code for tokens, and reads the member', async () => {
    const app = credentials();
    const calls = fakeFetch([
      [
        /oauth\/v2\/accessToken/,
        200,
        { access_token: 'li', refresh_token: 'li-r', expires_in: 5_184_000 },
      ],
      [/v2\/userinfo/, 200, { sub: 'm-1', name: 'Asha', picture: 'https://img/a.png' }],
    ]);
    expect(await PROVIDERS.LINKEDIN.exchange(app, 'the-code', CALLBACK, 'v')).toEqual({
      accessToken: 'li',
      refreshToken: 'li-r',
      expiresInSeconds: 5_184_000,
    });
    expect(formOf(calls[0])).toEqual({
      grant_type: 'authorization_code',
      code: 'the-code',
      redirect_uri: CALLBACK,
      client_id: app.clientId,
      client_secret: app.clientSecret,
    });
    expect(await PROVIDERS.LINKEDIN.accounts(tokens('li'), app)).toEqual([
      {
        network: 'LINKEDIN',
        externalId: 'm-1',
        name: 'Asha',
        handle: '',
        avatarUrl: 'https://img/a.png',
      },
    ]);
    expect(calls[1].headers.Authorization).toBe('Bearer li');
  });
});

describe('X provider', () => {
  it('asks for consent with PKCE', () => {
    const app = credentials();
    const consent = PROVIDERS.X.authorizeUrl(app, CALLBACK, 'state-2', 'the-challenge');
    expect(paramsOf(consent)).toMatchObject({
      client_id: app.clientId,
      scope: 'tweet.read tweet.write users.read offline.access',
      code_challenge: 'the-challenge',
      code_challenge_method: 'S256',
    });
  });

  it('exchanges the code with the verifier and basic auth', async () => {
    const app = credentials();
    const calls = fakeFetch([[/2\/oauth2\/token/, 200, { access_token: 'xt' }]]);
    expect(await PROVIDERS.X.exchange(app, 'code', CALLBACK, 'the-verifier')).toEqual({
      accessToken: 'xt',
      refreshToken: '',
      expiresInSeconds: null,
    });
    expect(formOf(calls[0]).code_verifier).toBe('the-verifier');
    const basic = Buffer.from(`${app.clientId}:${app.clientSecret}`).toString('base64');
    expect(calls[0].headers.Authorization).toBe(`Basic ${basic}`);
  });

  it('reads the profile, and copes with a reply that has none', async () => {
    fakeFetch([
      [
        /users\/me/,
        200,
        {
          data: { id: 'x-1', name: 'Exyconn', username: 'exyconn', profile_image_url: 'https://i' },
        },
      ],
    ]);
    expect(await PROVIDERS.X.accounts(tokens(), credentials())).toEqual([
      {
        network: 'X',
        externalId: 'x-1',
        name: 'Exyconn',
        handle: '@exyconn',
        avatarUrl: 'https://i',
      },
    ]);
    jest.restoreAllMocks();
    fakeFetch([[/users\/me/, 200, {}]]);
    expect(await PROVIDERS.X.accounts(tokens(), credentials())).toEqual([
      { network: 'X', externalId: '', name: '', handle: '@', avatarUrl: '' },
    ]);
  });
});

describe('YouTube provider', () => {
  it('asks for offline consent so a refresh token is issued', () => {
    const consent = PROVIDERS.YOUTUBE.authorizeUrl(credentials(), CALLBACK, 's', 'ch');
    expect(paramsOf(consent)).toMatchObject({
      access_type: 'offline',
      prompt: 'consent',
      code_challenge: 'ch',
    });
  });

  it('reads every channel the login owns, thumbnails and all', async () => {
    fakeFetch([
      [
        /channels\?part=snippet/,
        200,
        {
          items: [
            {
              id: 'UC1',
              snippet: {
                title: 'Exyconn',
                customUrl: '@exyconn',
                thumbnails: { default: { url: 'https://yt/t.png' } },
              },
            },
            { id: 'UC2' },
          ],
        },
      ],
    ]);
    expect(await PROVIDERS.YOUTUBE.accounts(tokens(), credentials())).toEqual([
      {
        network: 'YOUTUBE',
        externalId: 'UC1',
        name: 'Exyconn',
        handle: '@exyconn',
        avatarUrl: 'https://yt/t.png',
      },
      { network: 'YOUTUBE', externalId: 'UC2', name: '', handle: '', avatarUrl: '' },
    ]);
  });

  it('reads no channel when the reply lists none', async () => {
    fakeFetch([[/channels\?part=snippet/, 200, {}]]);
    expect(await PROVIDERS.YOUTUBE.accounts(tokens(), credentials())).toEqual([]);
  });
});

describe('Meta provider', () => {
  it('uses each Page’s picture, and reads nothing from a reply without pages', async () => {
    fakeFetch([
      [
        /me\/accounts/,
        200,
        {
          data: [
            {
              id: 'p1',
              name: 'Exyconn',
              access_token: 'pt',
              picture: { data: { url: 'https://fb/p.png' } },
            },
          ],
        },
      ],
    ]);
    const [page] = await PROVIDERS.META.accounts(tokens(), credentials());
    expect(page).toMatchObject({
      network: 'FACEBOOK',
      avatarUrl: 'https://fb/p.png',
      neverExpires: true,
    });

    jest.restoreAllMocks();
    fakeFetch([[/me\/accounts/, 200, { data: 'none' }]]);
    expect(await PROVIDERS.META.accounts(tokens(), credentials())).toEqual([]);
  });
});
