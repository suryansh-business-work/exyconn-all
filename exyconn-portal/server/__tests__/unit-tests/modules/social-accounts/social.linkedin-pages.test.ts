import { randomUUID } from 'node:crypto';
import {
  completeConnect,
  restartWithoutPages,
  saveAppConfig,
} from '../../../../src/modules/social-accounts/social.service';
import { syncAccount } from '../../../../src/modules/social-accounts/social.sync';
import {
  SocialAccountModel,
  SocialAppConfigModel,
  SocialOAuthStateModel,
} from '../../../../src/modules/social-accounts/social.models';
import { AuditLogModel } from '../../../../src/modules/audit';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { open } from '../../../../src/utils/secretBox';
import { useTestOrganization } from '../../../helpers';
import { codeOf } from '../codeOf';
import { configureApp, connectAccount, fakeFetch, type Route } from './social.fixtures';

const ORGANIZATION = useTestOrganization();
const PAGE_SCOPES = 'openid,profile,w_member_social,r_organization_admin,w_organization_social';

afterEach(() => jest.restoreAllMocks());

async function started(): Promise<string> {
  const nonce = randomUUID();
  await runAsPlatform(() =>
    SocialOAuthStateModel.create({
      nonce,
      app: 'LINKEDIN',
      organizationId: ORGANIZATION,
      userId: 'u-marketing',
      codeVerifier: 'v'.repeat(43),
      returnTo: 'https://portal.exyconn.com/marketing/social',
    }),
  );
  return nonce;
}

const tokenRoute = (scope: string): Route => [
  /oauth\/v2\/accessToken/,
  200,
  { access_token: 'li-token', expires_in: 3600, scope },
];
const member: Route = [/v2\/userinfo/, 200, { sub: 'm-1', name: 'Suryansh Srivastava' }];
const acls = (...ids: string[]): Route => [
  /organizationAcls\?q=roleAssignee&role=ADMINISTRATOR&state=APPROVED/,
  200,
  { elements: ids.map((id) => ({ organization: `urn:li:organization:${id}` })) },
];
const organization = (id: string, name: string, logo = ''): Route => [
  new RegExp(`rest/organizations/${id}$`),
  200,
  { id, localizedName: name, vanityName: name.toLowerCase(), logoV2: { original: logo } },
];

describe('connecting LinkedIn with company pages', () => {
  it('saves the member and one account per page it administers, sharing the stored token', async () => {
    await configureApp('LINKEDIN');
    const calls = fakeFetch([
      tokenRoute(PAGE_SCOPES),
      member,
      acls('42', '43'),
      organization('42', 'Exyconn', 'urn:li:digitalmediaAsset:LOGO1'),
      organization('43', 'Exyconn Labs'),
      [/rest\/images\//, 200, { downloadUrl: 'https://media.licdn.com/logo1.png' }],
    ]);

    expect(await completeConnect('LINKEDIN', await started(), 'code')).toMatchObject({
      connected: 3,
    });

    const person = await SocialAccountModel.findOne({ externalId: 'm-1' }).lean();
    expect(person).toMatchObject({ kind: 'PERSON', scopes: PAGE_SCOPES.split(',') });
    expect(open(String(person?.accessToken))).toBe('li-token');
    const pages = await SocialAccountModel.find({ kind: 'ORGANIZATION' }).sort({ name: 1 }).lean();
    expect(pages).toEqual([
      expect.objectContaining({
        network: 'LINKEDIN',
        externalId: '42',
        name: 'Exyconn',
        handle: 'exyconn',
        avatarUrl: 'https://media.licdn.com/logo1.png',
        tokenAccountId: person?._id.toHexString(),
        accessToken: '',
        organizationId: expect.anything(),
      }),
      expect.objectContaining({ externalId: '43', name: 'Exyconn Labs', avatarUrl: '' }),
    ]);
    expect(calls.find((call) => call.url.includes('images/'))?.url).toContain(
      encodeURIComponent('urn:li:image:LOGO1'),
    );
    const audit = await AuditLogModel.findOne({ module: 'SocialAccount' }).lean();
    expect(audit).toMatchObject({
      action: 'CREATE',
      actorId: 'u-marketing',
      summary: 'Connected LinkedIn: Suryansh Srivastava and 2 company page(s)',
    });
  });

  it('connects a member whose grant has no page scopes, reading no pages', async () => {
    await configureApp('LINKEDIN');
    const calls = fakeFetch([tokenRoute('openid,profile,w_member_social'), member]);

    expect(await completeConnect('LINKEDIN', await started(), 'code')).toMatchObject({
      connected: 1,
    });
    expect(calls.some((call) => call.url.includes('organizationAcls'))).toBe(false);
    expect(await SocialAccountModel.countDocuments({ kind: 'ORGANIZATION' })).toBe(0);
  });

  it('connects the page without a logo when LinkedIn will not hand it over', async () => {
    await configureApp('LINKEDIN');
    fakeFetch([
      tokenRoute(PAGE_SCOPES),
      member,
      acls('42'),
      organization('42', 'Exyconn', 'urn:li:digitalmediaAsset:LOGO1'),
      [/rest\/images\//, 403, { message: 'Not enough permissions' }],
    ]);
    await completeConnect('LINKEDIN', await started(), 'code');
    expect(await SocialAccountModel.findOne({ externalId: '42' }).lean()).toMatchObject({
      name: 'Exyconn',
      avatarUrl: '',
    });
  });
});

describe('syncing a LinkedIn member', () => {
  async function memberWithPage() {
    const person = await connectAccount('LINKEDIN', 'LINKEDIN', {
      externalId: 'm-1',
      scopes: PAGE_SCOPES.split(','),
    });
    const page = await SocialAccountModel.create({
      network: 'LINKEDIN',
      app: 'LINKEDIN',
      kind: 'ORGANIZATION',
      externalId: '42',
      name: 'Old Page',
      tokenAccountId: person._id.toHexString(),
      connectedBy: 'u1',
    });
    return { person, page };
  }

  it('adds new pages and marks pages the member no longer administers disconnected', async () => {
    const { person, page } = await memberWithPage();
    fakeFetch([acls('50'), organization('50', 'New Page')]);

    const result = await syncAccount(person._id.toHexString());

    expect(result.error).toBe('');
    expect((await SocialAccountModel.findById(page._id).lean())?.disconnectedAt).toBeInstanceOf(
      Date,
    );
    expect(await SocialAccountModel.findOne({ externalId: '50' }).lean()).toMatchObject({
      name: 'New Page',
      disconnectedAt: null,
    });
    expect(await AuditLogModel.findOne({ summary: /Old Page disconnected/ }).lean()).toMatchObject({
      action: 'UPDATE',
      actorId: 'system',
    });
  });

  it('reconnects a page the member administers again', async () => {
    const { person, page } = await memberWithPage();
    await SocialAccountModel.updateOne({ _id: page._id }, { disconnectedAt: new Date() });
    fakeFetch([acls('42'), organization('42', 'Old Page')]);

    await syncAccount(person._id.toHexString());

    expect((await SocialAccountModel.findById(page._id).lean())?.disconnectedAt).toBeNull();
  });

  it('drops the page scopes on a 403, so the row asks for a reconnect, and still syncs', async () => {
    const { person } = await memberWithPage();
    fakeFetch([[/organizationAcls/, 403, { message: 'Not enough permissions' }]]);

    expect((await syncAccount(person._id.toHexString())).error).toBe('');

    const stored = await SocialAccountModel.findById(person._id).lean();
    expect(stored?.scopes).toEqual(['openid', 'profile', 'w_member_social']);
  });

  it('records any other refusal from the page list as the sync error', async () => {
    const { person } = await memberWithPage();
    fakeFetch([[/organizationAcls/, 500, { message: 'LinkedIn is down' }]]);

    expect((await syncAccount(person._id.toHexString())).error).toMatch('LinkedIn is down');
  });

  it("posts and reads a page through its member's token", async () => {
    const { page } = await memberWithPage();
    const calls = fakeFetch([[/rest\/posts\?q=author/, 200, { elements: [] }]]);

    expect(await syncAccount(page._id.toHexString())).toMatchObject({ synced: 0, error: '' });
    expect(calls[0].headers.Authorization).toBe('Bearer LINKEDIN-token');
  });

  it('says to reconnect a page whose member was disconnected', async () => {
    const { person, page } = await memberWithPage();
    await SocialAccountModel.deleteOne({ _id: person._id });

    expect((await syncAccount(page._id.toHexString())).error).toMatch('connect it again');
  });
});

describe('LinkedIn refusing the company-page scopes', () => {
  it('remembers the refusal and starts the same connection again with the member scopes', async () => {
    await configureApp('LINKEDIN');
    const nonce = await started();

    const consent = await restartWithoutPages(
      nonce,
      'Scope "r_organization_admin" is not authorized',
    );

    expect(new URL(consent).searchParams.get('scope')).toBe('openid profile w_member_social');
    const config = await runAsPlatform(() =>
      SocialAppConfigModel.findOne({ app: 'LINKEDIN' }).lean(),
    );
    expect(config?.pagesRefused).toBe(true);
    const states = await runAsPlatform(() => SocialOAuthStateModel.find().lean());
    expect(states).toHaveLength(1);
    expect(states[0]).toMatchObject({ userId: 'u-marketing', organizationId: ORGANIZATION });
    expect(states[0].nonce).not.toBe(nonce);
  });

  it('refuses rather than loops when the member scopes are refused too', async () => {
    await configureApp('LINKEDIN', { pagesRefused: true });
    expect(await codeOf(restartWithoutPages(await started(), 'w_member_social'))).toBe(
      'BAD_USER_INPUT',
    );
  });

  it('refuses a state that is gone', async () => {
    await configureApp('LINKEDIN');
    expect(await codeOf(restartWithoutPages('missing', ''))).toBe('BAD_USER_INPUT');
  });

  it('tries the pages again once Tech saves the app', async () => {
    await configureApp('LINKEDIN', { pagesRefused: true });
    const saved = await saveAppConfig({ app: 'LINKEDIN', clientId: 'li-client', enabled: true });
    expect(saved?.pagesRefused).toBe(false);
  });
});
