import { techResolvers } from '../../../../src/modules/tech/tech.resolvers';
import { techService } from '../../../../src/modules/tech/tech.service';
import {
  clearBackgroundJobs,
  registerBackgroundJob,
} from '../../../../src/modules/tech/jobs.registry';
import { assertPermission } from '../../../../src/lib/permissions';
import { assertPlatformStaff } from '../../../../src/lib/platformAccess';
import { forEachOrganization } from '../../../../src/modules/organizations';
import { ROLES } from '../../../../src/constants/roles';
import { forbidden } from '../../../../src/utils/errors';
import { logger } from '../../../../src/utils/logger';
import type { GraphQLContext } from '../../../../src/middleware/auth';

// Every service call is a stub here: these tests are about which guard a mutation passes
// through and what reaches the service, not about the service itself (see tech.service.*).
jest.mock('../../../../src/modules/tech/tech.service', () => {
  const stubs: Record<string, jest.Mock> = {};
  return {
    techService: new Proxy(stubs, { get: (target, key: string) => (target[key] ??= jest.fn()) }),
  };
});
jest.mock('../../../../src/lib/permissions', () => ({ assertPermission: jest.fn() }));
jest.mock('../../../../src/lib/platformAccess', () => ({ assertPlatformStaff: jest.fn() }));
jest.mock('../../../../src/middleware/roleGuard', () => ({ assertAuthenticated: jest.fn() }));
jest.mock('../../../../src/modules/organizations', () => ({ forEachOrganization: jest.fn() }));

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
type Guard = 'platform' | 'company';
/** Mutation name (also the service method it calls), guard, action, arguments, returns a row. */
type Row = [
  name: string,
  guard: Guard,
  action: string,
  args: Record<string, unknown>,
  row: boolean,
];

const Mutation = techResolvers.Mutation as unknown as Record<string, Resolver>;
const service = techService as unknown as Record<string, jest.Mock>;

const ctx: GraphQLContext = {
  user: { id: 'tech-1', roles: [ROLES.TECH], email: 'tech@exyconn.com' },
};
const id = 'row-1';
const input = { label: 'Primary' };

/** The create/update/delete trio every config type has, plus its "check it works" action. */
const configRows = (
  type: string,
  check: string,
  checkArgs: Record<string, unknown>,
  guard: Guard,
): Row[] => [
  [`create${type}`, guard, 'CREATE', { input }, true],
  [`update${type}`, guard, 'EDIT', { id, input }, true],
  [`delete${type}`, guard, 'DELETE', { id }, false],
  [check, guard, 'EDIT', { id, ...checkArgs }, false],
];

const rows: Row[] = [
  ...configRows('EmailConfig', 'sendTestEmail', { to: 'ops@example.com' }, 'platform'),
  ...configRows('InboundMailConfig', 'testInboundMailConnection', {}, 'company'),
  ...configRows('ImageConfig', 'testImageUpload', { file: 'data:', fileName: 'a.png' }, 'platform'),
  ...configRows('SlackConfig', 'sendTestSlackMessage', { channel: '#ops' }, 'platform'),
  ...configRows('GithubConfig', 'testGithubConnection', {}, 'platform'),
  ...configRows('PexelsConfig', 'testPexelsConnection', {}, 'platform'),
  ...configRows('OpenAiConfig', 'testOpenAiConnection', {}, 'platform'),
  ['startTrackerBuild', 'platform', 'CREATE', { platforms: ['WINDOWS'], ref: 'main' }, false],
  [
    'saveTrackerBuildSettings',
    'platform',
    'EDIT',
    { slackChannels: ['C001'], statusAlertChannels: ['A001'] },
    false,
  ],
];

const guardOf = (guard: Guard) => (guard === 'platform' ? assertPlatformStaff : assertPermission);
const otherGuardOf = (guard: Guard) =>
  guard === 'platform' ? assertPermission : assertPlatformStaff;

describe('the Tech mutations', () => {
  it.each(rows)(
    '%s passes the %s guard for %s, then calls the service',
    async (name, guard, action, args, returnsRow) => {
      service[name].mockResolvedValue(returnsRow ? { _id: id, ...input } : true);

      const result = await Mutation[name](null, args, ctx);

      expect(guardOf(guard)).toHaveBeenCalledWith(ctx, 'TechConfig', [ROLES.TECH], action);
      expect(otherGuardOf(guard)).not.toHaveBeenCalled();
      expect(service[name]).toHaveBeenCalledWith(...Object.values(args));
      expect(result).toEqual(returnsRow ? { _id: id, ...input, id } : true);
    },
  );

  it('every mutation in the module is covered above', () => {
    const tested = new Set([...rows.map(([name]) => name), 'runBackgroundJob']);

    expect(Object.keys(Mutation).filter((name) => !tested.has(name))).toEqual([]);
  });

  it.each([
    ['createEmailConfig', assertPlatformStaff],
    ['deleteInboundMailConfig', assertPermission],
  ] as const)('%s changes nothing when its guard refuses', async (name, guard) => {
    jest.mocked(guard).mockRejectedValueOnce(forbidden());

    await expect(Mutation[name](null, { id, input }, ctx)).rejects.toThrow(
      'You do not have access to this resource',
    );
    expect(service[name]).not.toHaveBeenCalled();
  });
});

describe('running a background job on request', () => {
  const runOnce = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    clearBackgroundJobs();
    registerBackgroundJob({
      key: 'reminders',
      label: 'Reminders',
      description: 'Sends the reminders that are due.',
      runOnce,
    });
    jest.spyOn(logger, 'info').mockImplementation(() => undefined);
    jest.mocked(forEachOrganization).mockResolvedValue();
  });
  afterEach(() => clearBackgroundJobs());

  it('takes one pass for every company, the way the timer does', async () => {
    await expect(Mutation.runBackgroundJob(null, { key: 'reminders' }, ctx)).resolves.toBe(true);

    expect(assertPlatformStaff).toHaveBeenCalledWith(ctx, 'TechConfig', [ROLES.TECH], 'EDIT');
    expect(forEachOrganization).toHaveBeenCalledWith(runOnce, 'Reminders (on request)');
    expect(logger.info).toHaveBeenCalledWith('Background job reminders run on request');
  });

  it('answers false for a job nobody registered and runs nothing', async () => {
    await expect(Mutation.runBackgroundJob(null, { key: 'nope' }, ctx)).resolves.toBe(false);

    expect(forEachOrganization).not.toHaveBeenCalled();
  });

  it('runs nothing when the guard refuses', async () => {
    jest.mocked(assertPlatformStaff).mockRejectedValueOnce(forbidden());

    await expect(Mutation.runBackgroundJob(null, { key: 'reminders' }, ctx)).rejects.toThrow(
      'You do not have access to this resource',
    );
    expect(forEachOrganization).not.toHaveBeenCalled();
  });
});
