import { GraphQLError } from 'graphql';
import {
  OrganizationModel,
  ensurePlatformOperatorOrganization,
} from '../../src/modules/organizations';
import { techResolvers } from '../../src/modules/tech';
import { GithubConfigModel } from '../../src/modules/tech/github-config.model';
import { SlackConfigModel } from '../../src/modules/tech/slack-config.model';
import { techTypeDefs } from '../../src/modules/tech/tech.typeDefs';
import { secretHint } from '../../src/modules/tech/tech.secrets';
import { websiteResolvers } from '../../src/modules/website';
import { statusResolvers } from '../../src/modules/status';
import { infraResolvers } from '../../src/modules/infra';
import { i18nResolvers } from '../../src/modules/i18n';
import { assertPlatformStaff, invalidatePlatformOperatorCache } from '../../src/lib/platformAccess';
import { invalidatePermissionCache } from '../../src/lib/permissions';
import { runAsPlatform } from '../../src/lib/tenant';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const TECH = { ...techResolvers.Query, ...techResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;
const WEBSITE = { ...websiteResolvers.Query, ...websiteResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;
const STATUS = { ...statusResolvers.Query, ...statusResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;
const INFRA = infraResolvers.Query as unknown as Record<string, Resolver>;
const I18N = { ...i18nResolvers.Query, ...i18nResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;

/** Never a literal credential: the value only has to look like a long token. */
const TOKEN = process.env.TEST_GITHUB_TOKEN ?? `github_pat_${'x'.repeat(24)}wxyz`;

const organization = (name: string, createdAt: Date) =>
  runAsPlatform(() =>
    OrganizationModel.create({
      name,
      slug: name.toLowerCase(),
      currency: 'USD',
      createdAt,
    }),
  );

const as = (roles: Role[], organizationId: string | null): GraphQLContext => ({
  user: { id: 'u1', email: 'u@x.com', roles, organizationId },
  organizationId,
});

const codeOf = async (promise: Promise<unknown>) => {
  try {
    await promise;
    return 'OK';
  } catch (error) {
    return error instanceof GraphQLError ? error.extensions.code : String(error);
  }
};

let operatorId: string;
let customerId: string;

beforeEach(async () => {
  invalidatePlatformOperatorCache();
  invalidatePermissionCache();
  const operator = await organization('Exyconn', new Date('2024-01-01'));
  const customer = await organization('Acme', new Date('2025-01-01'));
  operatorId = String(operator._id);
  customerId = String(customer._id);
  await ensurePlatformOperatorOrganization();
});

describe('the platform operator organization', () => {
  it('flags the oldest company, once, and never a second', async () => {
    const flagged = await runAsPlatform(() =>
      OrganizationModel.find({ isPlatformOperator: true }).lean(),
    );
    expect(flagged.map((row) => String(row._id))).toEqual([operatorId]);

    await ensurePlatformOperatorOrganization();
    await organization('Older', new Date('2020-01-01'));
    await ensurePlatformOperatorOrganization();
    expect(
      await runAsPlatform(() => OrganizationModel.countDocuments({ isPlatformOperator: true })),
    ).toBe(1);
  });

  it('does nothing on an install with no company yet', async () => {
    await runAsPlatform(() => OrganizationModel.deleteMany({}));
    await expect(ensurePlatformOperatorOrganization()).resolves.toBeUndefined();
  });
});

describe('assertPlatformStaff', () => {
  it('lets a SUPER_ADMIN with no organization through without a module role', async () => {
    await expect(
      codeOf(
        assertPlatformStaff(as([ROLES.SUPER_ADMIN], null), 'TechConfig', [ROLES.TECH], 'VIEW'),
      ),
    ).resolves.toBe('OK');
  });

  it('refuses a SUPER_ADMIN who sits inside a customer company', async () => {
    const ctx = as([ROLES.SUPER_ADMIN], customerId);
    await expect(
      codeOf(assertPlatformStaff(ctx, 'TechConfig', [ROLES.TECH], 'VIEW')),
    ).resolves.toBe('FORBIDDEN');
  });

  it('lets the operator company’s TECH in, and still checks the role', async () => {
    await expect(
      codeOf(assertPlatformStaff(as([ROLES.TECH], operatorId), 'TechConfig', [ROLES.TECH], 'VIEW')),
    ).resolves.toBe('OK');
    await expect(
      codeOf(assertPlatformStaff(as([ROLES.HR], operatorId), 'TechConfig', [ROLES.TECH], 'VIEW')),
    ).resolves.toBe('FORBIDDEN');
  });

  it('refuses the same roles in any other company, ADMIN included', async () => {
    for (const roles of [[ROLES.TECH], [ROLES.ADMIN]]) {
      await expect(
        codeOf(assertPlatformStaff(as(roles, customerId), 'TechConfig', [ROLES.TECH], 'VIEW')),
      ).resolves.toBe('FORBIDDEN');
    }
  });

  it('refuses nobody signed in as unauthenticated', async () => {
    const anonymous: GraphQLContext = { user: null, organizationId: null };
    await expect(
      codeOf(assertPlatformStaff(anonymous, 'TechConfig', [ROLES.TECH], 'VIEW')),
    ).resolves.toBe('UNAUTHENTICATED');
  });
});

describe('platform features refuse a customer company', () => {
  const customerTech = () => as([ROLES.TECH, ROLES.WEBSITE, ROLES.ADMIN], customerId);

  it('Tech configs', async () => {
    await expect(codeOf(TECH.listGithubConfigs(null, {}, customerTech()))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(codeOf(TECH.listEmailConfigs(null, {}, customerTech()))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(codeOf(TECH.trackerBuildSettings(null, {}, customerTech()))).resolves.toBe(
      'FORBIDDEN',
    );
  });

  it('the website CMS and inbox, but not the public site', async () => {
    await expect(codeOf(WEBSITE.listBlogPosts(null, {}, customerTech()))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(codeOf(WEBSITE.listWebsiteSubmissions(null, {}, customerTech()))).resolves.toBe(
      'FORBIDDEN',
    );
    expect(WEBSITE.websiteFormTypes(null, {}, { user: null })).toEqual(expect.any(Array));
  });

  it('status admin, infrastructure and the translation review', async () => {
    await expect(codeOf(STATUS.listStatusMonitors(null, {}, customerTech()))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(codeOf(INFRA.dockerStorage(null, {}, customerTech()))).resolves.toBe('FORBIDDEN');
    await expect(
      codeOf(
        I18N.setTranslation(null, { locale: 'de', source: 'Save', text: 'X' }, customerTech()),
      ),
    ).resolves.toBe('FORBIDDEN');
  });

  it('while the operator company reaches them', async () => {
    const operatorTech = as([ROLES.TECH, ROLES.WEBSITE], operatorId);
    await expect(codeOf(TECH.listGithubConfigs(null, {}, operatorTech))).resolves.toBe('OK');
    await expect(codeOf(WEBSITE.listBlogPosts(null, {}, operatorTech))).resolves.toBe('OK');
    await expect(codeOf(STATUS.listStatusMonitors(null, {}, operatorTech))).resolves.toBe('OK');
  });
});

describe('platform secrets are write-only', () => {
  const source = techTypeDefs.loc?.source.body ?? '';

  it('no credential type returns its secret', () => {
    for (const [type, field] of [
      ['EmailConfig', 'password'],
      ['ImageConfig', 'privateKey'],
      ['SlackConfig', 'botToken'],
      ['GithubConfig', 'token'],
      ['PexelsConfig', 'apiKey'],
      ['OpenAiConfig', 'apiKey'],
    ]) {
      const body = new RegExp(String.raw`type ${type} \{([^}]*)\}`).exec(source)?.[1] ?? '';
      expect(body).not.toMatch(new RegExp(String.raw`^\s*${field}:`, 'm'));
    }
  });

  it('says whether one is stored and shows only the end of a long token', async () => {
    const operatorTech = as([ROLES.TECH], operatorId);
    await TECH.createGithubConfig(
      null,
      { input: { label: 'Builds', owner: 'exyconn', repo: 'exyconn-all', token: TOKEN } },
      operatorTech,
    );
    const [row] = (await TECH.listGithubConfigs(null, {}, operatorTech)) as Array<
      Record<string, unknown>
    >;
    const github = techResolvers.GithubConfig;
    expect(github.hasToken(row)).toBe(true);
    expect(github.tokenHint(row)).toBe('wxyz');
    expect(secretHint('short')).toBeNull();
  });

  it('keeps the stored secret when an update leaves it blank', async () => {
    const operatorTech = as([ROLES.TECH], operatorId);
    const created = (await TECH.createGithubConfig(
      null,
      { input: { label: 'Builds', owner: 'exyconn', repo: 'exyconn-all', token: TOKEN } },
      operatorTech,
    )) as { id: string };
    await TECH.updateGithubConfig(
      null,
      { id: created.id, input: { label: 'Renamed', owner: 'exyconn', repo: 'app', token: '' } },
      operatorTech,
    );
    const stored = await GithubConfigModel.findById(created.id).lean();
    expect(stored).toMatchObject({ label: 'Renamed', repo: 'app', token: TOKEN });
  });

  it('refuses a new credential with no secret', async () => {
    const operatorTech = as([ROLES.TECH], operatorId);
    await expect(
      codeOf(
        TECH.createSlackConfig(
          null,
          { input: { label: 'Slack', botToken: ' ', defaultChannel: '#x' } },
          operatorTech,
        ),
      ),
    ).resolves.toBe('BAD_USER_INPUT');
    expect(await SlackConfigModel.countDocuments()).toBe(0);
  });
});
