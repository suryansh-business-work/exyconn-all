import { Types } from 'mongoose';
import type { GraphQLError } from 'graphql';
import {
  assertApprovePermission,
  assertPermission,
  invalidatePermissionCache,
  isAllowed,
  permissionsFor,
} from '../../../src/lib/permissions';
import { RolePermissionModel } from '../../../src/modules/permissions/permission.model';
import { runForOrganization } from '../../../src/lib/tenant';
import { ROLES, type Role } from '../../../src/constants/roles';
import type { GraphQLContext } from '../../../src/middleware/auth';

const ctxWith = (...roles: Role[]): GraphQLContext => ({
  user: { id: String(new Types.ObjectId()), email: 'u@example.com', roles },
});

const codeOf = (promise: Promise<unknown>) =>
  promise.then(
    () => 'ALLOWED',
    (error: unknown) => (error as GraphQLError).extensions?.code,
  );

const restrict = (role: Role, module: string, actions: string[]) =>
  RolePermissionModel.create({ role, module, actions });

beforeEach(() => invalidatePermissionCache());
afterEach(() => jest.restoreAllMocks());

describe('assertPermission', () => {
  it('lets ADMIN through without reading the matrix', async () => {
    const find = jest.spyOn(RolePermissionModel, 'find');
    const ctx = ctxWith(ROLES.ADMIN);
    await expect(assertPermission(ctx, 'Goal', [ROLES.HR], 'DELETE')).resolves.toBe(ctx.user);
    expect(find).not.toHaveBeenCalled();
  });

  it('still requires one of the module’s roles first', async () => {
    await expect(
      codeOf(assertPermission(ctxWith(ROLES.CRM), 'Goal', [ROLES.HR], 'VIEW')),
    ).resolves.toBe('FORBIDDEN');
    await expect(
      codeOf(assertPermission({ user: null }, 'Goal', [ROLES.HR], 'VIEW')),
    ).resolves.toBe('UNAUTHENTICATED');
  });

  it('allows everything when nobody has restricted the role', async () => {
    const ctx = ctxWith(ROLES.HR);
    await expect(assertPermission(ctx, 'Goal', [ROLES.HR], 'DELETE')).resolves.toBe(ctx.user);
  });

  it('refuses an action the administrator took away, naming it', async () => {
    await restrict(ROLES.HR, 'Goal', ['VIEW']);
    const ctx = ctxWith(ROLES.HR);
    await expect(assertPermission(ctx, 'Goal', [ROLES.HR], 'VIEW')).resolves.toBe(ctx.user);
    await expect(assertPermission(ctx, 'Goal', [ROLES.HR], 'CREATE')).rejects.toThrow(
      'Your role may not create Goal',
    );
  });

  it('measures only the caller’s roles that open the module', async () => {
    await restrict(ROLES.HR, 'Goal', ['VIEW']);
    const ctx = ctxWith(ROLES.HR, ROLES.FINANCE);
    await expect(codeOf(assertPermission(ctx, 'Goal', [ROLES.HR], 'EDIT'))).resolves.toBe(
      'FORBIDDEN',
    );
    await expect(
      codeOf(assertPermission(ctx, 'Goal', [ROLES.HR, ROLES.FINANCE], 'EDIT')),
    ).resolves.toBe('ALLOWED');
  });

  it('reuses the matrix for ten seconds unless invalidated', async () => {
    const ctx = ctxWith(ROLES.HR);
    const start = Date.now();
    const clock = jest.spyOn(Date, 'now').mockReturnValue(start);
    await assertPermission(ctx, 'Goal', [ROLES.HR], 'EDIT');
    await restrict(ROLES.HR, 'Goal', []);

    clock.mockReturnValue(start + 9_999);
    await expect(codeOf(assertPermission(ctx, 'Goal', [ROLES.HR], 'EDIT'))).resolves.toBe(
      'ALLOWED',
    );

    clock.mockReturnValue(start + 10_000);
    await expect(codeOf(assertPermission(ctx, 'Goal', [ROLES.HR], 'EDIT'))).resolves.toBe(
      'FORBIDDEN',
    );
  });

  it('applies the change at once after invalidation', async () => {
    const ctx = ctxWith(ROLES.HR);
    await assertPermission(ctx, 'Goal', [ROLES.HR], 'EDIT');
    await restrict(ROLES.HR, 'Goal', []);
    invalidatePermissionCache();
    await expect(codeOf(assertPermission(ctx, 'Goal', [ROLES.HR], 'VIEW'))).resolves.toBe(
      'FORBIDDEN',
    );
  });

  it('keeps one company’s restrictions out of another company’s cache', async () => {
    const strict = String(new Types.ObjectId());
    const relaxed = String(new Types.ObjectId());
    await runForOrganization(strict, () => restrict(ROLES.HR, 'Goal', []));
    const ctx = ctxWith(ROLES.HR);
    const check = () => codeOf(assertPermission(ctx, 'Goal', [ROLES.HR], 'VIEW'));
    await expect(runForOrganization(strict, check)).resolves.toBe('FORBIDDEN');
    await expect(runForOrganization(relaxed, check)).resolves.toBe('ALLOWED');
  });
});

describe('assertApprovePermission', () => {
  beforeEach(() => restrict(ROLES.HR, 'Leave', ['VIEW']));

  it('lets ADMIN approve', async () => {
    await expect(
      assertApprovePermission(ctxWith(ROLES.ADMIN), 'Leave', [ROLES.HR]),
    ).resolves.toBeUndefined();
  });

  it('lets a manager acting through the reporting line approve', async () => {
    await expect(
      assertApprovePermission(ctxWith(ROLES.EMPLOYEE), 'Leave', [ROLES.HR]),
    ).resolves.toBeUndefined();
    await expect(
      assertApprovePermission({ user: null }, 'Leave', [ROLES.HR]),
    ).resolves.toBeUndefined();
  });

  it('measures a module role against the matrix', async () => {
    await expect(
      codeOf(assertApprovePermission(ctxWith(ROLES.HR), 'Leave', [ROLES.HR])),
    ).resolves.toBe('FORBIDDEN');
  });
});

describe('isAllowed and permissionsFor', () => {
  it('answers without throwing', async () => {
    await restrict(ROLES.HR, 'Goal', ['VIEW', 'EXPORT']);
    await expect(isAllowed([ROLES.ADMIN], 'Goal', 'DELETE')).resolves.toBe(true);
    await expect(isAllowed([ROLES.HR], 'Goal', 'VIEW')).resolves.toBe(true);
    await expect(isAllowed([ROLES.HR], 'Goal', 'DELETE')).resolves.toBe(false);
    await expect(isAllowed([ROLES.HR], 'Expense', 'DELETE')).resolves.toBe(true);
  });

  it('lists every registered module in order with what the roles may do', async () => {
    await restrict(ROLES.TECH, 'AppLog', ['VIEW', 'EXPORT']);
    const matrix = await permissionsFor([ROLES.TECH]);
    const modules = matrix.map((row) => row.module);
    expect(modules).toEqual([...modules].sort((a, b) => a.localeCompare(b)));
    expect(modules).toEqual(expect.arrayContaining(['AppLog', 'User', 'Tracker']));
    expect(matrix.find((row) => row.module === 'AppLog')).toEqual({
      module: 'AppLog',
      view: true,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: true,
    });
    expect(matrix.find((row) => row.module === 'User')?.delete).toBe(true);
  });

  it('gives ADMIN every action everywhere', async () => {
    await restrict(ROLES.ADMIN, 'AppLog', []);
    const matrix = await permissionsFor([ROLES.ADMIN]);
    const flags = matrix.flatMap((row) => [
      row.view,
      row.create,
      row.edit,
      row.delete,
      row.approve,
      row.export,
    ]);
    expect(flags.every(Boolean)).toBe(true);
  });
});
