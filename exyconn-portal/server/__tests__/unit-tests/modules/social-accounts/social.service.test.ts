import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import {
  completeConnect,
  disconnect,
  saveAppConfig,
} from '../../../../src/modules/social-accounts/social.service';
import {
  SocialAccountModel,
  SocialAppConfigModel,
  SocialOAuthStateModel,
} from '../../../../src/modules/social-accounts/social.models';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { open } from '../../../../src/utils/secretBox';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { HOUR, configureApp, fakeFetch } from './social.fixtures';
import type { SocialApp } from '../../../../src/modules/social-accounts/social.constants';

const ORGANIZATION = useTestOrganization();

afterEach(() => jest.restoreAllMocks());

/** A connection someone in the company started, as the callback finds it. */
async function started(app: SocialApp): Promise<string> {
  const nonce = randomUUID();
  await runAsPlatform(() =>
    SocialOAuthStateModel.create({
      nonce,
      app,
      organizationId: ORGANIZATION,
      userId: 'u-marketing',
      codeVerifier: 'v'.repeat(43),
      returnTo: 'https://portal.exyconn.com/marketing/social',
    }),
  );
  return nonce;
}

describe('saving an app', () => {
  it('refuses to turn an app on without a client ID, and writes nothing', async () => {
    await expect(
      saveAppConfig({ app: 'LINKEDIN', clientId: '  ', clientSecret: 'x', enabled: true }),
    ).rejects.toThrow('Add the client ID');
    expect(await runAsPlatform(() => SocialAppConfigModel.countDocuments())).toBe(0);
  });

  it('saves a switched-off app with no secret at all', async () => {
    const saved = await saveAppConfig({ app: 'X', clientId: ' x-client ', enabled: false });
    expect(saved).toMatchObject({
      app: 'X',
      clientId: 'x-client',
      clientSecret: '',
      enabled: false,
    });

    const again = await saveAppConfig({
      app: 'X',
      clientId: 'x-client',
      clientSecret: null,
      enabled: false,
    });
    expect(again?.clientSecret).toBe('');
  });
});

describe('completing a connection', () => {
  it('keeps a LinkedIn member with its own expiry and no refresh token', async () => {
    await configureApp('LINKEDIN');
    const nonce = await started('LINKEDIN');
    fakeFetch([
      [/oauth\/v2\/accessToken/, 200, { access_token: 'li-token', expires_in: 3600 }],
      [/v2\/userinfo/, 200, { sub: 'm-1', name: 'Asha', picture: 'https://img/a.png' }],
    ]);

    expect(await completeConnect('LINKEDIN', nonce, 'code')).toEqual({
      returnTo: 'https://portal.exyconn.com/marketing/social',
      connected: 1,
    });

    const stored = await SocialAccountModel.findOne({ network: 'LINKEDIN' }).lean();
    expect(stored).toMatchObject({ externalId: 'm-1', name: 'Asha', connectedBy: 'u-marketing' });
    expect(open(String(stored?.accessToken))).toBe('li-token');
    expect(stored?.refreshToken).toBe('');
    expect(stored?.expiresAt?.getTime()).toBeGreaterThan(Date.now() + HOUR / 2);
  });

  it('seals a YouTube refresh token, and keeps no expiry the provider did not give', async () => {
    await configureApp('YOUTUBE');
    const nonce = await started('YOUTUBE');
    fakeFetch([
      [/oauth2\.googleapis\.com\/token/, 200, { access_token: 'yt', refresh_token: 'yt-r' }],
      [/channels\?part=snippet/, 200, { items: [{ id: 'UC1', snippet: { title: 'Exyconn' } }] }],
    ]);

    await completeConnect('YOUTUBE', nonce, 'code');

    const stored = await SocialAccountModel.findOne({ network: 'YOUTUBE' }).lean();
    expect(open(String(stored?.refreshToken))).toBe('yt-r');
    expect(stored?.expiresAt).toBeNull();
  });

  it('updates a reconnected account in place rather than adding another', async () => {
    await configureApp('LINKEDIN');
    const answer = () =>
      fakeFetch([
        [/oauth\/v2\/accessToken/, 200, { access_token: 'li-token' }],
        [/v2\/userinfo/, 200, { sub: 'm-1', name: 'Asha' }],
      ]);
    answer();
    await completeConnect('LINKEDIN', await started('LINKEDIN'), 'code');
    jest.restoreAllMocks();
    answer();
    await completeConnect('LINKEDIN', await started('LINKEDIN'), 'code');
    expect(await SocialAccountModel.countDocuments()).toBe(1);
  });

  it('refuses a login that reaches no account', async () => {
    await configureApp('YOUTUBE');
    const nonce = await started('YOUTUBE');
    fakeFetch([
      [/oauth2\.googleapis\.com\/token/, 200, { access_token: 'yt' }],
      [/channels\?part=snippet/, 200, { items: [] }],
    ]);
    await expect(completeConnect('YOUTUBE', nonce, 'code')).rejects.toThrow(
      'YouTube returned no account this login can manage.',
    );
    expect(await SocialAccountModel.countDocuments()).toBe(0);
  });

  it('refuses a state started for a different provider', async () => {
    await configureApp('X');
    const nonce = await started('LINKEDIN');
    expect(await codeOf(completeConnect('X', nonce, 'code'))).toBe('BAD_USER_INPUT');
  });
});

describe('disconnecting', () => {
  it('says not found for an account that is not there', async () => {
    expect(await codeOf(disconnect(new Types.ObjectId().toHexString()))).toBe('NOT_FOUND');
  });
});
