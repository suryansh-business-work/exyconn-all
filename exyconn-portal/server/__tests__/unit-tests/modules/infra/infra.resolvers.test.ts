import { infraResolvers, infraService, infraTypeDefs } from '../../../../src/modules/infra';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';
import { asArg } from '../../../mockAs';

/** A platform administrator stands above the companies and passes the platform guard. */
const platformAdmin: GraphQLContext = {
  user: { id: 'root', email: 'root@exyconn.com', roles: [ROLES.SUPER_ADMIN], organizationId: null },
  organizationId: null,
};
const anonymous: GraphQLContext = { user: null };

const { Query } = infraResolvers;

afterEach(() => {
  jest.restoreAllMocks();
});

const container = (id: string, name: string) => ({
  id,
  name,
  image: 'x:1',
  imageTag: '1',
  state: 'RUNNING',
  status: 'Up',
  health: 'NONE',
  createdAt: new Date(0),
  ports: [],
  networks: [],
  ipAddress: '',
});

describe('infrastructure resolvers', () => {
  it('lists containers alphabetically for the platform', async () => {
    jest
      .spyOn(infraService, 'containers')
      .mockResolvedValue([container('2', 'web'), container('1', 'api'), container('3', 'mongo')]);

    const rows = await Query.dockerContainers(null, {}, platformAdmin);

    expect(rows.map((row) => row.name)).toEqual(['api', 'mongo', 'web']);
  });

  it('passes the requested container id through to the detail read', async () => {
    const detail = jest
      .spyOn(infraService, 'containerDetail')
      .mockResolvedValue(asArg({ id: 'abc' }));

    await expect(Query.dockerContainerDetail(null, { id: 'abc' }, platformAdmin)).resolves.toEqual({
      id: 'abc',
    });
    expect(detail).toHaveBeenCalledWith('abc');
  });

  it('returns the overview and the storage read', async () => {
    const overview = { docker: {}, runtime: {}, database: {} } as Awaited<
      ReturnType<typeof infraService.overview>
    >;
    const storage = {
      images: [],
      usage: { layersBytes: 1, containersBytes: 2, volumesBytes: 3, buildCacheBytes: 4 },
    };
    jest.spyOn(infraService, 'overview').mockResolvedValue(overview);
    jest.spyOn(infraService, 'storage').mockResolvedValue(storage);

    await expect(Query.infrastructureOverview(null, {}, platformAdmin)).resolves.toBe(overview);
    await expect(Query.dockerStorage(null, {}, platformAdmin)).resolves.toBe(storage);
  });

  it('refuses every read to somebody who is not signed in, before touching the engine', async () => {
    const containers = jest.spyOn(infraService, 'containers');

    await expect(codeOf(Query.infrastructureOverview(null, {}, anonymous))).resolves.toBe(
      'UNAUTHENTICATED',
    );
    await expect(codeOf(Query.dockerContainers(null, {}, anonymous))).resolves.toBe(
      'UNAUTHENTICATED',
    );
    await expect(codeOf(Query.dockerContainerDetail(null, { id: 'abc' }, anonymous))).resolves.toBe(
      'UNAUTHENTICATED',
    );
    await expect(codeOf(Query.dockerStorage(null, {}, anonymous))).resolves.toBe('UNAUTHENTICATED');
    expect(containers).not.toHaveBeenCalled();
  });

  it('declares every query it resolves in the schema', () => {
    const source = infraTypeDefs.loc?.source.body ?? '';

    for (const name of Object.keys(Query)) {
      expect(source).toContain(name);
    }
  });
});
