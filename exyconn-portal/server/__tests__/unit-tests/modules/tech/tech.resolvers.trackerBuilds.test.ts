import { techResolvers } from '../../../../src/modules/tech/tech.resolvers';
import { trackerReleasesService } from '../../../../src/modules/tech/tracker-releases.service';
import { assertPlatformStaff } from '../../../../src/lib/platformAccess';
import { recordAudit } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import { forbidden } from '../../../../src/utils/errors';
import type { GraphQLContext } from '../../../../src/middleware/auth';

jest.mock('../../../../src/modules/tech/tracker-releases.service', () => ({
  trackerReleasesService: { list: jest.fn(), delete: jest.fn(), saveRetention: jest.fn() },
}));
jest.mock('../../../../src/lib/platformAccess', () => ({ assertPlatformStaff: jest.fn() }));
jest.mock('../../../../src/modules/audit', () => ({ recordAudit: jest.fn() }));

type Resolver = (parent: unknown, args: Record<string, unknown>, ctx: GraphQLContext) => unknown;
const Query = techResolvers.Query as unknown as Record<string, Resolver>;
const Mutation = techResolvers.Mutation as unknown as Record<string, Resolver>;
const service = jest.mocked(trackerReleasesService);

const ctx: GraphQLContext = {
  user: { id: 'tech-1', roles: [ROLES.TECH], email: 'tech@exyconn.com' },
};

const guardedFor = (action: string) =>
  expect(assertPlatformStaff).toHaveBeenCalledWith(ctx, 'TechConfig', [ROLES.TECH], action);

describe('tracker build releases', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists the builds for platform staff', async () => {
    const builds = [{ id: '1' }];
    service.list.mockResolvedValue(builds as never);
    await expect(Query.trackerBuildReleases(null, {}, ctx)).resolves.toBe(builds);
    guardedFor('VIEW');
  });

  it('deletes a build and records who did it', async () => {
    service.delete.mockResolvedValue({ id: '7', tag: 'tracker-v1.2.3', version: '1.2.3' } as never);
    await expect(Mutation.deleteTrackerBuildRelease(null, { id: '7' }, ctx)).resolves.toBe(true);
    guardedFor('DELETE');
    expect(service.delete).toHaveBeenCalledWith('7');
    expect(recordAudit).toHaveBeenCalledWith(ctx, {
      action: 'DELETE',
      module: 'TechConfig',
      entityId: '7',
      entityLabel: 'tracker-v1.2.3',
      summary: 'Deleted tracker build 1.2.3',
    });
  });

  it('deletes nothing when the guard refuses', async () => {
    jest.mocked(assertPlatformStaff).mockImplementationOnce(async () => forbidden());
    await expect(Mutation.deleteTrackerBuildRelease(null, { id: '7' }, ctx)).rejects.toThrow(
      'You do not have access to this resource',
    );
    expect(service.delete).not.toHaveBeenCalled();
    expect(recordAudit).not.toHaveBeenCalled();
  });

  it('saves how many builds to keep', async () => {
    service.saveRetention.mockResolvedValue({ keepLatestBuilds: 4 } as never);
    await expect(
      Mutation.saveTrackerBuildRetention(null, { keepLatestBuilds: 4 }, ctx),
    ).resolves.toEqual({ keepLatestBuilds: 4 });
    guardedFor('EDIT');
    expect(service.saveRetention).toHaveBeenCalledWith(4);
  });
});

describe('starting a build', () => {
  it('builds the committed version when no bump is sent', async () => {
    const { techService } = jest.requireActual<
      typeof import('../../../../src/modules/tech/tech.service')
    >('../../../../src/modules/tech/tech.service');
    const start = jest.spyOn(techService, 'startTrackerBuild').mockResolvedValue(true);
    await Mutation.startTrackerBuild(null, { platforms: ['IOS'], ref: 'main', bump: null }, ctx);
    expect(start).toHaveBeenCalledWith(['IOS'], 'main', 'NONE');
    start.mockRestore();
  });
});
