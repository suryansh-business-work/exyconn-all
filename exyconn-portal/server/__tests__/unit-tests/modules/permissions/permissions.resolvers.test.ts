import { permissionsResolvers, permissionsTypeDefs } from '../../../../src/modules/permissions';
import { RolePermissionModel } from '../../../../src/modules/permissions/permission.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { invalidatePermissionCache } from '../../../../src/lib/permissions';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { codeOf } from '../codeOf';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const P = {
  ...permissionsResolvers.Query,
  ...permissionsResolvers.Mutation,
} as unknown as Record<string, Resolver>;

const as = (roles?: string[]) =>
  ({ user: { id: 'u1', email: 'u@exyconn.com', roles } }) as unknown as GraphQLContext;
const admin = as([ROLES.ADMIN]);
const hr = as([ROLES.HR]);
const anonymous = { user: null } as unknown as GraphQLContext;

interface MatrixRow {
  module: string;
  view: boolean;
  create: boolean;
  export: boolean;
}

// 'Branding' is one of the hand-written modules, registered without loading its resolvers.
const MODULE = 'Branding';

beforeEach(() => invalidatePermissionCache());

describe('the permission matrix reads', () => {
  it('ships its schema', () => {
    expect(permissionsTypeDefs).toBeDefined();
  });

  it('lists the registered modules alphabetically, to ADMIN only', async () => {
    const modules = (await P.listPermissionModules(null, {}, admin)) as string[];

    expect(modules).toContain(MODULE);
    expect(modules).toEqual([...modules].sort((a, b) => a.localeCompare(b)));
    // This resolver is synchronous, so its guard throws on the call rather than rejecting.
    expect(await codeOf(Promise.resolve().then(() => P.listPermissionModules(null, {}, hr)))).toBe(
      'FORBIDDEN',
    );
  });

  it('lists the restriction rows ordered by role then module', async () => {
    await RolePermissionModel.create({ role: ROLES.HR, module: 'User', actions: ['VIEW'] });
    await RolePermissionModel.create({ role: ROLES.HR, module: 'AuditLog', actions: [] });
    await RolePermissionModel.create({ role: ROLES.FINANCE, module: 'User', actions: [] });

    const rows = (await P.listRolePermissions(null, {}, admin)) as Array<{
      id: string;
      role: string;
      module: string;
    }>;

    expect(rows.map((row) => `${row.role}:${row.module}`)).toEqual([
      'FINANCE:User',
      'HR:AuditLog',
      'HR:User',
    ]);
    expect(rows[0].id).toEqual(expect.any(String));
  });

  it("myPermissions shows the caller's own restrictions", async () => {
    await RolePermissionModel.create({ role: ROLES.HR, module: MODULE, actions: ['VIEW'] });

    const matrix = (await P.myPermissions(null, {}, hr)) as MatrixRow[];
    const branding = matrix.find((row) => row.module === MODULE);

    expect(branding).toMatchObject({ view: true, create: false, export: false });
    expect(matrix.find((row) => row.module === 'User')).toMatchObject({ view: true, create: true });
  });

  it('myPermissions leaves a caller with no roles nothing to do', async () => {
    const matrix = (await P.myPermissions(null, {}, as())) as MatrixRow[];

    expect(matrix.length).toBeGreaterThan(0);
    expect(matrix.every((row) => !row.view && !row.create)).toBe(true);
  });

  it('myPermissions needs a signed-in caller', async () => {
    expect(await codeOf(P.myPermissions(null, {}, anonymous))).toBe('UNAUTHENTICATED');
  });
});

describe('canExport', () => {
  it('is open while no restriction exists and closed once EXPORT is left out', async () => {
    await expect(P.canExport(null, { module: MODULE }, hr)).resolves.toBe(true);

    await RolePermissionModel.create({ role: ROLES.HR, module: MODULE, actions: ['VIEW'] });
    invalidatePermissionCache();

    await expect(P.canExport(null, { module: MODULE }, hr)).resolves.toBe(false);
  });

  it('is always open to ADMIN and closed to a caller with no roles', async () => {
    await RolePermissionModel.create({ role: ROLES.HR, module: MODULE, actions: [] });

    await expect(P.canExport(null, { module: MODULE }, admin)).resolves.toBe(true);
    await expect(P.canExport(null, { module: MODULE }, as())).resolves.toBe(false);
  });

  it('refuses an unknown module and an anonymous caller', async () => {
    await expect(P.canExport(null, { module: 'Nope' }, hr)).rejects.toThrow('Unknown module: Nope');
    expect(await codeOf(P.canExport(null, { module: MODULE }, anonymous))).toBe('UNAUTHENTICATED');
  });
});

describe('changing the matrix', () => {
  it('stores each action once and audits the restriction', async () => {
    const row = (await P.setRolePermission(
      null,
      { role: ROLES.HR, module: MODULE, actions: ['VIEW', 'EDIT', 'VIEW'] },
      admin,
    )) as { id: string; actions: string[] };

    expect(row.actions).toEqual(['VIEW', 'EDIT']);
    expect(row.id).toEqual(expect.any(String));
    const audit = await AuditLogModel.findOne({ module: 'Permission' }).lean();
    expect(audit).toMatchObject({
      action: 'PERMISSION',
      entityId: `${ROLES.HR}:${MODULE}`,
      summary: `Restricted ${ROLES.HR} on ${MODULE} to [VIEW, EDIT]`,
    });
  });

  it('replaces an existing row rather than adding a second, and defaults to no actions', async () => {
    await P.setRolePermission(null, { role: ROLES.HR, module: MODULE, actions: ['VIEW'] }, admin);
    const row = (await P.setRolePermission(null, { role: ROLES.HR, module: MODULE }, admin)) as {
      actions: string[];
    };

    expect(row.actions).toEqual([]);
    expect(await RolePermissionModel.countDocuments({ role: ROLES.HR, module: MODULE })).toBe(1);
  });

  it('only ADMIN may change it', async () => {
    expect(
      await codeOf(P.setRolePermission(null, { role: ROLES.HR, module: MODULE, actions: [] }, hr)),
    ).toBe('FORBIDDEN');
    expect(await codeOf(P.clearRolePermission(null, { role: ROLES.HR, module: MODULE }, hr))).toBe(
      'FORBIDDEN',
    );
    expect(await RolePermissionModel.countDocuments()).toBe(0);
  });

  it('clearing says whether there was anything to clear, and audits either way', async () => {
    await expect(
      P.clearRolePermission(null, { role: ROLES.HR, module: MODULE }, admin),
    ).resolves.toBe(false);

    await RolePermissionModel.create({ role: ROLES.HR, module: MODULE, actions: [] });
    await expect(
      P.clearRolePermission(null, { role: ROLES.HR, module: MODULE }, admin),
    ).resolves.toBe(true);

    expect(await RolePermissionModel.countDocuments()).toBe(0);
    const summaries = (await AuditLogModel.find({ module: 'Permission' }).lean()).map(
      (row) => row.summary,
    );
    expect(summaries).toEqual([
      `Cleared the restriction on ${ROLES.HR} for ${MODULE}`,
      `Cleared the restriction on ${ROLES.HR} for ${MODULE}`,
    ]);
  });

  it('a cleared restriction stops applying straight away', async () => {
    await P.setRolePermission(null, { role: ROLES.HR, module: MODULE, actions: [] }, admin);
    await expect(P.canExport(null, { module: MODULE }, hr)).resolves.toBe(false);

    await P.clearRolePermission(null, { role: ROLES.HR, module: MODULE }, admin);

    await expect(P.canExport(null, { module: MODULE }, hr)).resolves.toBe(true);
  });
});
