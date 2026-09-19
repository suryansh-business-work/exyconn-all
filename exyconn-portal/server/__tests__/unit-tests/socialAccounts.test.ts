import express from 'express';
import request from 'supertest';
import { Types } from 'mongoose';
import { socialAccountsResolvers, socialCallbackRouter } from '../../src/modules/social-accounts';
import {
  SocialAccountModel,
  SocialAppConfigModel,
  SocialOAuthStateModel,
} from '../../src/modules/social-accounts/social.models';
import { completeConnect } from '../../src/modules/social-accounts/social.service';
import { open, seal } from '../../src/utils/secretBox';
import { runAsPlatform } from '../../src/lib/tenant';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';
import { OPERATOR_ORGANIZATION_ID, seedPlatformOperator } from './security-authz.operator';

const ORGANIZATION = useTestOrganization();

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = socialAccountsResolvers.Query as unknown as Record<string, Resolver>;
const M = socialAccountsResolvers.Mutation as unknown as Record<string, Resolver>;

const ctx = (roles: Role[], organizationId = ORGANIZATION) =>
  ({
    user: { id: new Types.ObjectId().toHexString(), email: 'm@exyconn.com', roles, organizationId },
    organizationId,
    origin: undefined,
  }) as unknown as GraphQLContext;
const marketing = () => ctx([ROLES.MARKETING]);
const techStaff = () => ctx([ROLES.TECH], OPERATOR_ORGANIZATION_ID);

const META = {
  app: 'META',
  clientId: 'meta-client',
  clientSecret: 'meta-secret-0123456789',
  enabled: true,
};

/** Answers each provider URL with the JSON a real one would send. */
function fakeProvider(routes: Record<string, unknown>) {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    const key = Object.keys(routes).find((prefix) => url.includes(prefix));
    const body = key ? routes[key] : { error: { message: `unexpected ${url}` } };
    return new Response(JSON.stringify(body), { status: key ? 200 : 400 });
  });
}

describe('secretBox', () => {
  it('seals and opens, and refuses a tampered value', () => {
    const sealed = seal('token-123');
    expect(sealed).not.toContain('token-123');
    expect(open(sealed)).toBe('token-123');
    const [v, iv, tag, body] = sealed.split('.');
    expect(() => open([v, iv, tag, `${body.slice(0, -2)}AA`].join('.'))).toThrow();
  });
});

describe('social app configs (Tech)', () => {
  beforeEach(() => seedPlatformOperator());

  it('lists all four providers with the callback to register', async () => {
    const rows = (await Q.socialAppConfigs(null, {}, techStaff())) as {
      app: string;
      callbackUrl: string;
    }[];
    expect(rows.map((row) => row.app)).toEqual(['LINKEDIN', 'META', 'X', 'YOUTUBE']);
    expect(rows[1].callbackUrl).toMatch(/\/oauth\/social\/meta\/callback$/);
  });

  it('keeps the stored secret when a save leaves it blank, and never returns it', async () => {
    await M.saveSocialAppConfig(null, { input: META }, techStaff());
    await M.saveSocialAppConfig(null, { input: { ...META, clientSecret: '' } }, techStaff());
    const stored = await runAsPlatform(() => SocialAppConfigModel.findOne({ app: 'META' }).lean());
    expect(stored?.clientSecret).toBe(META.clientSecret);
    const resolve = socialAccountsResolvers.SocialAppConfig;
    expect(resolve.hasClientSecret({ clientSecret: META.clientSecret })).toBe(true);
    expect(resolve.clientSecretHint({ clientSecret: META.clientSecret })).toBe('6789');
  });

  it('refuses to turn an app on without its secret', async () => {
    await expect(
      M.saveSocialAppConfig(null, { input: { ...META, app: 'X', clientSecret: '' } }, techStaff()),
    ).rejects.toThrow('Add the client secret');
    expect(await runAsPlatform(() => SocialAppConfigModel.countDocuments({ app: 'X' }))).toBe(0);
  });

  it("is refused to a customer company's tech staff", async () => {
    await expect(Q.socialAppConfigs(null, {}, ctx([ROLES.TECH]))).rejects.toThrow();
  });
});

describe('connecting an account (Marketing)', () => {
  beforeEach(async () => {
    await seedPlatformOperator();
    await M.saveSocialAppConfig(null, { input: META }, techStaff());
  });
  afterEach(() => jest.restoreAllMocks());

  it('says which providers can be connected', async () => {
    const rows = (await Q.socialAppStatuses(null, {}, marketing())) as {
      app: string;
      available: boolean;
    }[];
    expect(rows.filter((row) => row.available).map((row) => row.app)).toEqual(['META']);
  });

  it('refuses a provider Tech has not set up', async () => {
    await expect(M.startSocialConnect(null, { app: 'X' }, marketing())).rejects.toThrow(
      'not set up yet',
    );
  });

  it('connects every Page and Instagram account a Meta login reaches, tokens sealed', async () => {
    const consent = (await M.startSocialConnect(null, { app: 'META' }, marketing())) as string;
    const state = new URL(consent).searchParams.get('state') ?? '';
    expect(consent).toContain('client_id=meta-client');

    fakeProvider({
      'fb_exchange_token=': { access_token: 'long-user-token', expires_in: 5_184_000 },
      'oauth/access_token': { access_token: 'short-user-token', expires_in: 3600 },
      '/me/accounts': {
        data: [
          {
            id: 'page-1',
            name: 'Exyconn',
            access_token: 'page-token',
            instagram_business_account: { id: 'ig-1', username: 'exyconn' },
          },
        ],
      },
    });
    const result = await completeConnect('META', state, 'the-code');

    expect(result.connected).toBe(2);
    expect(result.returnTo).toMatch(/\/marketing\/social$/);
    const accounts = (await Q.socialAccounts(null, {}, marketing())) as Record<string, unknown>[];
    expect(accounts.map((row) => [row.network, row.name, row.handle])).toEqual([
      ['FACEBOOK', 'Exyconn', ''],
      ['INSTAGRAM', 'exyconn', '@exyconn'],
    ]);
    expect(accounts[0].accessToken).toBeUndefined();
    const stored = await SocialAccountModel.findOne({ network: 'FACEBOOK' }).lean();
    expect(open(String(stored?.accessToken))).toBe('page-token');
    expect(stored?.expiresAt).toBeNull();
  });

  it('refuses a callback whose state was already used', async () => {
    const consent = (await M.startSocialConnect(null, { app: 'META' }, marketing())) as string;
    const state = new URL(consent).searchParams.get('state') ?? '';
    await runAsPlatform(() => SocialOAuthStateModel.deleteOne({ nonce: state }));
    await expect(completeConnect('META', state, 'code')).rejects.toThrow(
      'expired or was already used',
    );
  });

  it('disconnects an account', async () => {
    const account = await SocialAccountModel.create({
      network: 'X',
      app: 'X',
      externalId: 'x-1',
      name: 'Exyconn',
      accessToken: seal('t'),
      connectedBy: 'u1',
    });
    await M.disconnectSocialAccount(null, { id: String(account._id) }, marketing());
    expect(await SocialAccountModel.countDocuments()).toBe(0);
  });

  it('is for Marketing only', async () => {
    await expect(Q.socialAccounts(null, {}, ctx([ROLES.EMPLOYEE]))).rejects.toThrow();
  });
});

describe('the provider callback', () => {
  const app = express().use('/oauth/social', socialCallbackRouter());

  beforeEach(async () => {
    await seedPlatformOperator();
    await M.saveSocialAppConfig(null, { input: META }, techStaff());
  });
  afterEach(() => jest.restoreAllMocks());

  it('sends the browser back to Marketing with what was connected', async () => {
    const consent = (await M.startSocialConnect(null, { app: 'META' }, marketing())) as string;
    const state = new URL(consent).searchParams.get('state') ?? '';
    fakeProvider({
      'fb_exchange_token=': { access_token: 'long', expires_in: 100 },
      'oauth/access_token': { access_token: 'short', expires_in: 10 },
      '/me/accounts': { data: [{ id: 'p1', name: 'Exyconn', access_token: 'pt' }] },
    });

    const response = await request(app).get(`/oauth/social/meta/callback?state=${state}&code=c`);

    expect(response.status).toBe(302);
    expect(response.headers.location).toMatch(/\/marketing\/social\?connected=META&count=1$/);
  });

  it('reports a cancelled consent back to Marketing', async () => {
    const consent = (await M.startSocialConnect(null, { app: 'META' }, marketing())) as string;
    const state = new URL(consent).searchParams.get('state') ?? '';

    const response = await request(app).get(
      `/oauth/social/meta/callback?state=${state}&error=access_denied`,
    );

    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('error=The+connection+was+cancelled');
  });

  it('refuses an unknown provider or a missing state', async () => {
    expect((await request(app).get('/oauth/social/myspace/callback?state=x&code=c')).status).toBe(
      400,
    );
    expect((await request(app).get('/oauth/social/meta/callback?code=c')).status).toBe(400);
  });
});
