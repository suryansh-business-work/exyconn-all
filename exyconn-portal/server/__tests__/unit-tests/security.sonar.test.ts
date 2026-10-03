import { GraphQLError } from 'graphql';
import {
  OrganizationModel,
  ensurePlatformOperatorOrganization,
} from '../../src/modules/organizations';
import { securityResolvers } from '../../src/modules/security';
import { securityTypeDefs } from '../../src/modules/security/security.typeDefs';
import { SonarConfigModel } from '../../src/modules/security/sonar-config.model';
import { clearSonarCache } from '../../src/modules/security/sonar.service';
import { SonarClient, SonarError } from '../../src/modules/security/sonar.client';
import {
  facetCounts,
  issueFile,
  mapAnalyses,
  mapIssues,
  mapMetrics,
  mapQualityGate,
  ratingLetter,
} from '../../src/modules/security/sonar.mapping';
import { techResolvers } from '../../src/modules/tech';
import { invalidatePlatformOperatorCache } from '../../src/lib/platformAccess';
import { invalidatePermissionCache } from '../../src/lib/permissions';
import { runAsPlatform } from '../../src/lib/tenant';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

// safeFetch resolves the host before connecting; the hosts here are fictional.
jest.mock('node:dns/promises', () => ({
  lookup: jest.fn().mockResolvedValue([{ address: '93.184.215.14', family: 4 }]),
}));

/** Never a literal credential: the value only has to look like a long token. */
const TOKEN = process.env.TEST_SONAR_TOKEN ?? `squ_${'x'.repeat(24)}wxyz`;
const HOST = 'https://sonar.example.test';
const PROJECT = 'exyconn_all';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const SECURITY = {
  ...securityResolvers.Query,
  ...securityResolvers.Mutation,
} as unknown as Record<string, Resolver>;

const platformAdmin: GraphQLContext = {
  user: { id: 'u1', email: 'u@x.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};

const input = (overrides: Record<string, unknown> = {}) => ({
  label: 'SonarCloud',
  hostUrl: `${HOST}/`,
  token: TOKEN,
  projectKey: PROJECT,
  organization: 'exyconn',
  isActive: true,
  ...overrides,
});

const createConfig = (overrides: Record<string, unknown> = {}) =>
  SECURITY.createSonarConfig(null, { input: input(overrides) }, platformAdmin) as Promise<{
    id: string;
  }>;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

/** Answers each Web API path from the table; a function receives the request headers. */
function mockSonar(routes: Record<string, Response | ((headers: Headers) => Response)>) {
  const fetchMock = jest.fn(async (url: string, init: RequestInit) => {
    const route = routes[new URL(url).pathname];
    if (!route) return json({}, 404);
    return typeof route === 'function' ? route(new Headers(init.headers)) : route.clone();
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

const PAYLOADS = {
  '/api/qualitygates/project_status': json({
    projectStatus: {
      status: 'ERROR',
      conditions: [
        {
          status: 'ERROR',
          metricKey: 'new_coverage',
          comparator: 'LT',
          errorThreshold: '80',
          actualValue: '61.2',
        },
      ],
    },
  }),
  '/api/measures/component': json({
    component: {
      measures: [
        { metric: 'bugs', value: '3' },
        { metric: 'coverage', value: '72.5' },
        { metric: 'reliability_rating', value: '3.0' },
        { metric: 'alert_status', value: 'ERROR' },
        { metric: 'new_bugs', period: { value: '1' } },
      ],
    },
  }),
  '/api/project_analyses/search': json({
    analyses: [
      {
        key: 'A1',
        date: '2026-10-03T10:00:00+0000',
        projectVersion: '1.9.7',
        events: [{ name: 'Failed' }],
      },
    ],
  }),
  '/api/issues/search': json({
    total: 41,
    issues: [
      {
        key: 'I1',
        rule: 'typescript:S3358',
        severity: 'MAJOR',
        type: 'CODE_SMELL',
        component: `${PROJECT}:src/app.ts`,
        line: 12,
        message: 'Extract this nested ternary',
      },
    ],
    facets: [
      { property: 'severities', values: [{ val: 'MAJOR', count: 30 }] },
      { property: 'types', values: [{ val: 'CODE_SMELL', count: 41 }] },
    ],
  }),
};

beforeEach(() => {
  clearSonarCache();
});

describe('mapping SonarQube payloads', () => {
  it('turns a 1-5 rating into a letter', () => {
    expect(['1.0', '2.0', '3.0', '4.0', '5.0'].map(ratingLetter)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
    ]);
    expect(ratingLetter(undefined)).toBeNull();
    expect(ratingLetter('2.5')).toBeNull();
  });

  it('reads every metric, from value or the new-code period, and nulls the rest', () => {
    const metrics = mapMetrics({
      component: {
        measures: [
          { metric: 'bugs', value: '3' },
          { metric: 'sqale_rating', value: '1.0' },
          { metric: 'alert_status', value: 'OK' },
          { metric: 'new_bugs', period: { value: '2' } },
          { metric: 'new_coverage', periods: [{ value: '88.1' }] },
          { metric: 'ncloc', value: 'n/a' },
        ],
      },
    });
    expect(metrics).toMatchObject({
      bugs: 3,
      maintainabilityRating: 'A',
      alertStatus: 'OK',
      newBugs: 2,
      newCoverage: 88.1,
      ncloc: null,
      coverage: null,
      securityRating: null,
    });
    expect(mapMetrics({}).alertStatus).toBeNull();
  });

  it('maps the gate, analyses, facets and issues with links back to SonarQube', () => {
    expect(mapQualityGate({})).toEqual({ status: 'NONE', conditions: [] });
    expect(mapQualityGate({ projectStatus: { conditions: [{}] } }).conditions).toEqual([
      { status: '', metric: '', comparator: '', errorThreshold: '', actualValue: '' },
    ]);
    expect(mapAnalyses({ analyses: [{ key: 'A', date: '2026-10-01T00:00:00Z' }] })).toEqual([
      { key: 'A', date: new Date('2026-10-01T00:00:00Z'), version: '', events: [] },
    ]);
    expect(mapAnalyses({})).toEqual([]);
    expect(
      mapAnalyses({ analyses: [{ key: 'B', date: '2026-10-02', events: [{}, { name: 'v2' }] }] })[0]
        .events,
    ).toEqual(['v2']);
    expect(facetCounts({}, 'severities')).toEqual([]);
    expect(facetCounts({ facets: [{ property: 'types' }] }, 'types')).toEqual([]);
    expect(issueFile(undefined, PROJECT)).toBe('');
    expect(issueFile('other:x.ts', PROJECT)).toBe('other:x.ts');
    expect(mapIssues({}, HOST, PROJECT)).toEqual([]);
    expect(mapIssues({ issues: [{ key: 'K' }] }, `${HOST}/`, PROJECT)).toEqual([
      {
        key: 'K',
        rule: '',
        severity: '',
        type: '',
        file: '',
        line: null,
        message: '',
        url: `${HOST}/project/issues?id=${PROJECT}&open=K`,
      },
    ]);
  });
});

describe('the SonarQube client', () => {
  const client = () => new SonarClient({ hostUrl: HOST, token: TOKEN });

  it('falls back to Basic auth after a 401 and keeps using it', async () => {
    const fetchMock = mockSonar({
      '/api/x': (headers) =>
        headers.get('authorization')?.startsWith('Basic ') ? json({ ok: 1 }) : json({}, 401),
    });
    const sonar = client();
    await expect(sonar.get('/api/x', { a: 1 })).resolves.toEqual({ ok: 1 });
    await expect(sonar.get('/api/x')).resolves.toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[0][0])).toBe(`${HOST}/api/x?a=1`);
  });

  it.each([
    [401, 'UNAUTHORIZED', 'did not accept the token'],
    [403, 'UNAUTHORIZED', 'no permission'],
    [404, 'NOT_FOUND', 'no project'],
    [500, 'ERROR', 'HTTP 500'],
  ])('reports HTTP %i as %s', async (status, problem, message) => {
    mockSonar({ '/api/x': json({}, status) });
    const error = await client()
      .get('/api/x')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(SonarError);
    expect(error).toMatchObject({ problem, message: expect.stringContaining(message) });
  });

  it('reports a server it cannot reach, and a body that is not JSON', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(client().get('/api/x')).rejects.toMatchObject({
      problem: 'UNREACHABLE',
      message: `SonarQube at ${HOST} could not be reached.`,
    });
    mockSonar({ '/api/x': new Response('<html>', { status: 200 }) });
    await expect(client().get('/api/x')).rejects.toMatchObject({ problem: 'ERROR' });
  });

  it('refuses a plain-http server before sending the token', async () => {
    const fetchMock = mockSonar({});
    await expect(
      new SonarClient({ hostUrl: 'http://sonar.example.test', token: TOKEN }).get('/api/x'),
    ).rejects.toMatchObject({ problem: 'UNREACHABLE', message: 'Use an https URL' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('the SonarQube config', () => {
  it('never returns the token, only whether one is stored and its end', async () => {
    const source = securityTypeDefs.loc?.source.body ?? '';
    const body = /type SonarConfig \{([^}]*)\}/.exec(source)?.[1] ?? '';
    expect(body).not.toMatch(/^\s*token:/m);

    await createConfig();
    const [row] = (await SECURITY.listSonarConfigs(null, {}, platformAdmin)) as Array<
      Record<string, unknown>
    >;
    expect(row.hostUrl).toBe(HOST);
    expect(techResolvers.SonarConfig.hasToken(row)).toBe(true);
    expect(techResolvers.SonarConfig.tokenHint(row)).toBe('wxyz');
  });

  it('keeps one active config and the stored token when an edit leaves it blank', async () => {
    const first = await createConfig();
    const second = await createConfig({ label: 'Second', organization: null });
    await SECURITY.updateSonarConfig(
      null,
      { id: first.id, input: input({ label: 'Renamed', token: '' }) },
      platformAdmin,
    );
    const stored = await SonarConfigModel.findById(first.id).lean();
    expect(stored).toMatchObject({ label: 'Renamed', token: TOKEN, isActive: true });
    expect(await SonarConfigModel.findById(second.id).lean()).toMatchObject({
      isActive: false,
      organization: '',
    });
    await SECURITY.updateSonarConfig(
      null,
      { id: second.id, input: input({ isActive: false }) },
      platformAdmin,
    );
  });

  it('refuses a config with no token, a bad project key or a missing record', async () => {
    await expect(createConfig({ token: ' ' })).rejects.toThrow('A SonarQube token is required.');
    await expect(createConfig({ projectKey: '12345' })).rejects.toThrow('project key');
    await expect(createConfig({ hostUrl: 'http://sonar.example.test' })).rejects.toThrow(
      'Use an https URL',
    );
    const missing = '64b000000000000000000000';
    await expect(
      SECURITY.updateSonarConfig(null, { id: missing, input: input() }, platformAdmin),
    ).rejects.toThrow('SonarQube config not found');
    await expect(SECURITY.deleteSonarConfig(null, { id: missing }, platformAdmin)).rejects.toThrow(
      'SonarQube config not found',
    );
    await expect(
      SECURITY.testSonarConnection(null, { id: missing }, platformAdmin),
    ).rejects.toThrow('SonarQube config not found');
  });

  it('deletes a config', async () => {
    const { id } = await createConfig();
    await expect(SECURITY.deleteSonarConfig(null, { id }, platformAdmin)).resolves.toBe(true);
    expect(await SonarConfigModel.countDocuments()).toBe(0);
  });
});

describe('testing the connection', () => {
  const test = async () => {
    const { id } = await createConfig();
    return SECURITY.testSonarConnection(null, { id }, platformAdmin);
  };

  it('names the project it found', async () => {
    mockSonar({
      '/api/authentication/validate': json({ valid: true }),
      '/api/components/show': json({ component: { name: 'Exyconn' } }),
    });
    await expect(test()).resolves.toEqual({
      ok: true,
      message: 'Connected to SonarQube and found the project Exyconn.',
    });
  });

  it('falls back to the key when the project has no name', async () => {
    mockSonar({
      '/api/authentication/validate': json({ valid: true }),
      '/api/components/show': json({}),
    });
    await expect(test()).resolves.toMatchObject({
      ok: true,
      message: expect.stringContaining(PROJECT),
    });
  });

  it('says when the token is not valid or the project is missing', async () => {
    mockSonar({ '/api/authentication/validate': json({ valid: false }) });
    await expect(test()).resolves.toEqual({
      ok: false,
      message: 'SonarQube did not accept the token.',
    });
    mockSonar({ '/api/authentication/validate': json({ valid: true }) });
    await expect(test()).resolves.toEqual({
      ok: false,
      message: 'SonarQube has no project with that key.',
    });
  });

  it('logs an unexpected failure and shows a plain message', async () => {
    const { id } = await createConfig();
    await SonarConfigModel.updateOne({ _id: id }, { hostUrl: 'not a url' });
    await expect(SECURITY.testSonarConnection(null, { id }, platformAdmin)).resolves.toEqual({
      ok: false,
      message: 'SonarQube could not be read.',
    });
  });
});

describe('the SonarQube overview', () => {
  const overview = (refresh = false) =>
    SECURITY.sonarOverview(null, { refresh }, platformAdmin) as Promise<Record<string, unknown>>;

  it('is NOT_CONFIGURED until a config is active', async () => {
    await expect(SECURITY.sonarOverview(null, {}, platformAdmin)).resolves.toMatchObject({
      state: 'NOT_CONFIGURED',
      projectUrl: '',
      metrics: null,
      issues: [],
    });
  });

  it('reads the gate, measures, analyses and issues, and caches them', async () => {
    const fetchMock = mockSonar(PAYLOADS);
    await createConfig();
    const result = await overview();
    expect(result).toMatchObject({
      state: 'OK',
      configLabel: 'SonarCloud',
      projectUrl: `${HOST}/dashboard?id=${PROJECT}`,
      qualityGate: { status: 'ERROR' },
      metrics: { bugs: 3, coverage: 72.5, reliabilityRating: 'C', newBugs: 1 },
      issuesTotal: 41,
      severityCounts: [{ value: 'MAJOR', count: 30 }],
      typeCounts: [{ value: 'CODE_SMELL', count: 41 }],
    });
    expect(result.issues).toEqual([
      expect.objectContaining({ file: 'src/app.ts', line: 12, rule: 'typescript:S3358' }),
    ]);
    const issuesCall = fetchMock.mock.calls.find(([url]) => url.includes('/api/issues/search'));
    expect(issuesCall?.[0]).toContain('organization=exyconn');
    expect(fetchMock).toHaveBeenCalledTimes(4);

    await expect(overview()).resolves.toBe(result);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    await overview(true);
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });

  it('leaves out the organization for a self-hosted server', async () => {
    const fetchMock = mockSonar({
      ...PAYLOADS,
      '/api/issues/search': json({ issues: [] }),
    });
    await createConfig({ organization: '' });
    await expect(overview()).resolves.toMatchObject({ issuesTotal: 0 });
    const issuesCall = fetchMock.mock.calls.find(([url]) => url.includes('/api/issues/search'));
    expect(issuesCall?.[0]).not.toContain('organization=');
  });

  it('turns a refusal or an unexpected failure into a state with a message', async () => {
    mockSonar({ '/api/qualitygates/project_status': json({}, 401) });
    const { id } = await createConfig();
    await expect(overview()).resolves.toMatchObject({
      state: 'UNAUTHORIZED',
      message: 'SonarQube did not accept the token.',
      configLabel: 'SonarCloud',
    });
    await SonarConfigModel.updateOne({ _id: id }, { hostUrl: 'not a url' });
    await expect(overview(true)).resolves.toMatchObject({
      state: 'ERROR',
      message: 'SonarQube could not be read.',
    });
  });
});

describe('issues of one severity', () => {
  const issues = (severity: string) =>
    SECURITY.sonarIssues(null, { severity }, platformAdmin) as Promise<unknown[]>;

  it('asks SonarQube for that severity only', async () => {
    const fetchMock = mockSonar(PAYLOADS);
    await createConfig({ organization: '' });
    await expect(issues('MAJOR')).resolves.toEqual([
      expect.objectContaining({ key: 'I1', file: 'src/app.ts' }),
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('severities=MAJOR');
  });

  it('says why when there is no project or SonarQube refuses', async () => {
    await expect(issues('MAJOR')).rejects.toThrow('No SonarQube project is set up yet.');
    mockSonar({ '/api/issues/search': json({}, 403) });
    const { id } = await createConfig();
    await expect(issues('MAJOR')).rejects.toThrow('no permission to browse');
    await SonarConfigModel.updateOne({ _id: id }, { hostUrl: 'not a url' });
    await expect(issues('MAJOR')).rejects.toThrow('Invalid URL');
  });
});

describe('the SSL report through the API', () => {
  it('is an empty report when no monitor has an https URL', async () => {
    for (const args of [{}, { refresh: true }]) {
      await expect(SECURITY.sslCertificates(null, args, platformAdmin)).resolves.toMatchObject({
        certificates: [],
      });
    }
  });
});

describe('who may use it', () => {
  const organization = (name: string, createdAt: Date) =>
    runAsPlatform(() =>
      OrganizationModel.create({ name, slug: name.toLowerCase(), currency: 'USD', createdAt }),
    );

  const codeOf = async (promise: Promise<unknown>) => {
    try {
      await promise;
      return 'OK';
    } catch (error) {
      return error instanceof GraphQLError ? error.extensions.code : String(error);
    }
  };

  it('is the platform operator’s staff only', async () => {
    invalidatePlatformOperatorCache();
    invalidatePermissionCache();
    await organization('Exyconn', new Date('2024-01-01'));
    const customer = await organization('Acme', new Date('2025-01-01'));
    await ensurePlatformOperatorOrganization();
    const customerId = String(customer._id);
    const customerTech: GraphQLContext = {
      user: {
        id: 'u2',
        email: 'c@x.com',
        roles: [ROLES.TECH, ROLES.ADMIN],
        organizationId: customerId,
      },
      organizationId: customerId,
    };
    for (const name of ['sslCertificates', 'listSonarConfigs', 'sonarOverview']) {
      await expect(codeOf(SECURITY[name](null, {}, customerTech))).resolves.toBe('FORBIDDEN');
    }
  });
});
