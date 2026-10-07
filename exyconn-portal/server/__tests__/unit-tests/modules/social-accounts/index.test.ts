import { socialAccountsResolvers } from '../../../../src/modules/social-accounts';
import { runAsPlatform } from '../../../../src/lib/tenant';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';
import { OPERATOR_ORGANIZATION_ID, seedPlatformOperator } from '../../security-authz.operator';
import { codeOf } from '../codeOf';
import { configureApp, ctxOf, fakeFetch, type Resolver } from './social.fixtures';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const ORGANIZATION = useTestOrganization();
const Q = socialAccountsResolvers.Query as unknown as Record<string, Resolver>;
const M = socialAccountsResolvers.Mutation as unknown as Record<string, Resolver>;
const marketing = () => ctxOf([ROLES.MARKETING], ORGANIZATION);
const techStaff = () => ctxOf([ROLES.TECH], OPERATOR_ORGANIZATION_ID);

afterEach(() => jest.restoreAllMocks());

describe('which providers Marketing can connect', () => {
  it('offers only an app that is on and has both its client ID and secret', async () => {
    await configureApp('LINKEDIN', { clientId: '' });
    await configureApp('X', { clientSecret: '' });
    await configureApp('YOUTUBE');
    await configureApp('THREADS', { enabled: false });

    const rows = (await Q.socialAppStatuses(null, {}, marketing())) as {
      app: string;
      available: boolean;
      networks: string[];
    }[];

    expect(Object.fromEntries(rows.map((row) => [row.app, row.available]))).toEqual({
      LINKEDIN: false,
      META: false,
      THREADS: false,
      X: false,
      YOUTUBE: true,
    });
    expect(rows.find((row) => row.app === 'META')?.networks).toEqual(['FACEBOOK', 'INSTAGRAM']);
  });
});

describe('testing an app from Tech', () => {
  beforeEach(() => seedPlatformOperator());

  it('reports what the provider made of the credentials', async () => {
    await configureApp('YOUTUBE');
    fakeFetch([[/oauth2\.googleapis/, 400, { error: 'invalid_grant' }]]);
    expect(await M.testSocialAppConfig(null, { app: 'YOUTUBE' }, techStaff())).toMatchObject({
      ok: true,
    });
  });

  it('is refused to anybody but platform Tech staff', async () => {
    expect(await codeOf(M.testSocialAppConfig(null, { app: 'YOUTUBE' }, marketing()))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('starting a connection', () => {
  it('refuses a caller who is in no company workspace', async () => {
    await configureApp('X');
    const noCompany = ctxOf([ROLES.MARKETING]);
    await expect(
      runAsPlatform(() => M.startSocialConnect(null, { app: 'X' }, noCompany)),
    ).rejects.toThrow('Connect social accounts from inside a company workspace');
  });
});

describe('disconnecting', () => {
  it('says not found for an account that is not connected', async () => {
    expect(
      await codeOf(
        M.disconnectSocialAccount(null, { id: '65f000000000000000000000' }, marketing()),
      ),
    ).toBe('NOT_FOUND');
  });

  it('is refused to somebody outside Marketing', async () => {
    const employee = ctxOf([ROLES.EMPLOYEE], ORGANIZATION);
    expect(await codeOf(M.disconnectSocialAccount(null, { id: 'x' }, employee))).toBe('FORBIDDEN');
  });
});

describe('the app config fields', () => {
  it('says whether a secret is stored, and hints none when it is blank', () => {
    const resolve = socialAccountsResolvers.SocialAppConfig;
    expect(resolve.hasClientSecret({ clientSecret: '' })).toBe(false);
    expect(resolve.clientSecretHint({ clientSecret: '' })).toBeNull();
  });

  it('refuses an unauthenticated caller everywhere', async () => {
    expect(await codeOf(Q.socialAccounts(null, {}, {} as GraphQLContext))).toBe('UNAUTHENTICATED');
  });
});
