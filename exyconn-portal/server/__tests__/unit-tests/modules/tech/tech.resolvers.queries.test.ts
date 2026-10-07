import { techResolvers } from '../../../../src/modules/tech/tech.resolvers';
import { techService } from '../../../../src/modules/tech/tech.service';
import {
  clearBackgroundJobs,
  registerBackgroundJob,
} from '../../../../src/modules/tech/jobs.registry';
import { assertPermission } from '../../../../src/lib/permissions';
import { assertPlatformStaff } from '../../../../src/lib/platformAccess';
import { assertAuthenticated } from '../../../../src/middleware/roleGuard';
import { ROLES } from '../../../../src/constants/roles';
import { forbidden, unauthenticated } from '../../../../src/utils/errors';
import type { GraphQLContext } from '../../../../src/middleware/auth';

// Every service call is a stub here: these tests are about which guard a screen passes
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
const Query = techResolvers.Query as unknown as Record<string, Resolver>;
const service = techService as unknown as Record<string, jest.Mock>;

const ctx: GraphQLContext = {
  user: { id: 'tech-1', roles: [ROLES.TECH], email: 'tech@exyconn.com' },
};
const ROW = { _id: 'row-1', label: 'Primary' };
const GUARD_ARGS = [ctx, 'TechConfig', [ROLES.TECH], 'VIEW'];

const platformLists = [
  'listEmailConfigs',
  'listImageConfigs',
  'listSlackConfigs',
  'listGithubConfigs',
  'listPexelsConfigs',
  'listOpenAiConfigs',
];

describe('the Tech config lists', () => {
  it.each(platformLists)('%s is for platform staff and gives every row an id', async (name) => {
    service[name].mockResolvedValue([ROW]);

    await expect(Query[name](null, {}, ctx)).resolves.toEqual([{ ...ROW, id: 'row-1' }]);
    expect(assertPlatformStaff).toHaveBeenCalledWith(...GUARD_ARGS);
    expect(assertPermission).not.toHaveBeenCalled();
  });

  it('lists the support mailboxes under the company permission, not the platform one', async () => {
    service.listInboundMailConfigs.mockResolvedValue([ROW]);

    await expect(Query.listInboundMailConfigs(null, {}, ctx)).resolves.toEqual([
      { ...ROW, id: 'row-1' },
    ]);
    expect(assertPermission).toHaveBeenCalledWith(...GUARD_ARGS);
    expect(assertPlatformStaff).not.toHaveBeenCalled();
  });

  it('reads nothing when the guard refuses', async () => {
    jest.mocked(assertPlatformStaff).mockRejectedValueOnce(forbidden());

    await expect(Query.listEmailConfigs(null, {}, ctx)).rejects.toThrow(
      'You do not have access to this resource',
    );
    expect(service.listEmailConfigs).not.toHaveBeenCalled();
  });
});

describe('the platform reads passed straight through', () => {
  it.each(['listSlackChannels', 'listTrackerBuilds', 'trackerBuildSettings'])(
    '%s is for platform staff and returns what the service returns',
    async (name) => {
      const answer = { from: name };
      service[name].mockResolvedValue(answer);

      await expect(Query[name](null, {}, ctx)).resolves.toBe(answer);
      expect(assertPlatformStaff).toHaveBeenCalledWith(...GUARD_ARGS);
    },
  );
});

describe('the background job console', () => {
  afterEach(() => clearBackgroundJobs());

  it('lists the registered loops for platform staff', async () => {
    clearBackgroundJobs();
    registerBackgroundJob({
      key: 'reminders',
      label: 'Reminders',
      description: 'Sends the reminders that are due.',
      runOnce: async () => undefined,
    });

    const jobs = await Query.backgroundJobs(null, {}, ctx);

    expect(jobs).toEqual([
      {
        key: 'reminders',
        label: 'Reminders',
        description: 'Sends the reminders that are due.',
        lastRunAt: null,
        lastRunSummary: '',
      },
    ]);
    expect(assertPlatformStaff).toHaveBeenCalledWith(...GUARD_ARGS);
  });
});

describe('the stock media search', () => {
  it.each(['searchPexelsPhotos', 'searchPexelsVideos'])(
    '%s opens on page one with no filters when none are sent',
    async (name) => {
      service[name].mockResolvedValue([]);

      await expect(
        Query[name](null, { query: 'desk', page: null, filters: null }, ctx),
      ).resolves.toEqual([]);
      expect(service[name]).toHaveBeenCalledWith('desk', 1, {});
      expect(assertAuthenticated).toHaveBeenCalledWith(ctx);
      expect(assertPlatformStaff).not.toHaveBeenCalled();
    },
  );

  it.each(['searchPexelsPhotos', 'searchPexelsVideos'])(
    '%s passes on the page and filters it was given',
    async (name) => {
      const filters = { orientation: 'landscape' };
      service[name].mockResolvedValue([]);

      await Query[name](null, { query: 'sea', page: 4, filters }, ctx);

      expect(service[name]).toHaveBeenCalledWith('sea', 4, filters);
    },
  );

  it('searches nothing for somebody who is not signed in', async () => {
    jest.mocked(assertAuthenticated).mockImplementationOnce(() => unauthenticated());

    await expect(Query.searchPexelsPhotos(null, { query: 'desk' }, { user: null })).rejects.toThrow(
      'Authentication required',
    );
    expect(service.searchPexelsPhotos).not.toHaveBeenCalled();
  });
});
