import { accessTokenOf } from '../../../../src/modules/social-accounts/social.tokens';
import { SocialAccountModel } from '../../../../src/modules/social-accounts/social.models';
import { open, seal } from '../../../../src/utils/secretBox';
import { useTestOrganization } from '../../../helpers';
import { HOUR, configureApp, connectAccount, fakeFetch, formOf } from './social.fixtures';

useTestOrganization();

afterEach(() => jest.restoreAllMocks());

const expired = () => new Date(Date.now() - HOUR);

describe('a token that is still valid', () => {
  it('is used as stored, even with no expiry at all', async () => {
    const account = await connectAccount('FACEBOOK', 'META');
    const fetched = jest.spyOn(globalThis, 'fetch');
    expect(await accessTokenOf(account.toObject())).toBe('FACEBOOK-token');
    expect(fetched).not.toHaveBeenCalled();
  });
});

describe('refreshing an expired token', () => {
  it('refreshes an X token with basic auth, keeping the rotated refresh token', async () => {
    const app = await configureApp('X');
    const account = await connectAccount('X', 'X', {
      expiresAt: expired(),
      refreshToken: seal('x-refresh-1'),
    });
    const calls = fakeFetch([
      [
        /api\.x\.com\/2\/oauth2\/token/,
        200,
        { access_token: 'x-fresh', refresh_token: 'x-refresh-2', expires_in: 7200 },
      ],
    ]);

    expect(await accessTokenOf(account.toObject())).toBe('x-fresh');

    expect(formOf(calls[0])).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'x-refresh-1',
      client_id: app.clientId,
    });
    const basic = Buffer.from(`${app.clientId}:${app.clientSecret}`).toString('base64');
    expect(calls[0].headers.Authorization).toBe(`Basic ${basic}`);
    const stored = await SocialAccountModel.findById(account._id).lean();
    expect(open(String(stored?.accessToken))).toBe('x-fresh');
    expect(open(String(stored?.refreshToken))).toBe('x-refresh-2');
    expect(stored?.expiresAt?.getTime()).toBeGreaterThan(Date.now() + HOUR);
  });

  it('refreshes a LinkedIn token, keeping the old refresh token and dropping the expiry', async () => {
    const app = await configureApp('LINKEDIN');
    const account = await connectAccount('LINKEDIN', 'LINKEDIN', {
      // Inside the two-minute margin: refreshed before it lapses mid-request.
      expiresAt: new Date(Date.now() + 60_000),
      refreshToken: seal('li-refresh'),
    });
    const calls = fakeFetch([
      [/linkedin\.com\/oauth\/v2\/accessToken/, 200, { access_token: 'li-new' }],
    ]);

    expect(await accessTokenOf(account.toObject())).toBe('li-new');

    expect(formOf(calls[0])).toEqual({
      grant_type: 'refresh_token',
      refresh_token: 'li-refresh',
      client_id: app.clientId,
      client_secret: app.clientSecret,
    });
    const stored = await SocialAccountModel.findById(account._id).lean();
    expect(open(String(stored?.refreshToken))).toBe('li-refresh');
    expect(stored?.expiresAt).toBeNull();
  });

  it('stores an empty token when the provider answers without one', async () => {
    await configureApp('YOUTUBE');
    const account = await connectAccount('YOUTUBE', 'YOUTUBE', {
      expiresAt: expired(),
      refreshToken: seal('yt-refresh'),
    });
    fakeFetch([[/oauth2\.googleapis\.com\/token/, 200, { access_token: 42 }]]);
    expect(await accessTokenOf(account.toObject())).toBe('');
  });
});

describe('a token that cannot be refreshed', () => {
  it('asks for a reconnect when there is no refresh token', async () => {
    const account = await connectAccount('YOUTUBE', 'YOUTUBE', { expiresAt: expired() });
    await expect(accessTokenOf(account.toObject())).rejects.toThrow(
      'YouTube refused the connection: the connection has expired — connect the account again',
    );
  });

  it('refuses when the app was switched off in the meantime', async () => {
    await configureApp('X', { enabled: false });
    const account = await connectAccount('X', 'X', {
      expiresAt: expired(),
      refreshToken: seal('x-refresh'),
    });
    await expect(accessTokenOf(account.toObject())).rejects.toThrow('X is not set up yet');
  });
});
