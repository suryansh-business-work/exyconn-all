// Loading the schema index registers every CRUD module in PERMISSION_MODULES, exactly as
// the running server does; without it only the modules this file imports would exist.
import '../../src/graphql';
import { payrollResolvers } from '../../src/modules/payroll';
import { GoalModel } from '../../src/modules/goals/goal.model';
import { goalsResolvers } from '../../src/modules/goals';
import { permissionsResolvers } from '../../src/modules/permissions';
import { invalidatePermissionCache } from '../../src/lib/permissions';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const G = { ...goalsResolvers.Query, ...goalsResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;
const P = { ...permissionsResolvers.Query, ...permissionsResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;
const as = (roles: string[]) =>
  ({ user: { id: 'u1', email: 'u@x.com', roles } }) as unknown as GraphQLContext;
const hr = as([ROLES.HR]);
const admin = as([ROLES.ADMIN]);
const goalInput = {
  employeeId: 'e1',
  title: 'Ship',
  description: '',
  kpi: '',
  weightage: 10,
  startDate: new Date(),
  endDate: new Date(),
  progress: 0,
  status: 'ACTIVE',
};

beforeEach(() => invalidatePermissionCache());

describe('permissions', () => {
  it('with no restriction rows, a module role can do everything (unchanged behaviour)', async () => {
    const created = (await G.createGoal(null, { input: goalInput }, hr)) as { id: string };
    await expect(G.listGoals(null, {}, hr)).resolves.toHaveLength(1);
    await expect(G.deleteGoal(null, { id: created.id }, hr)).resolves.toBe(true);
  });

  it('restricting HR on Goal to VIEW blocks create/edit/delete but keeps list', async () => {
    const created = (await G.createGoal(null, { input: goalInput }, hr)) as { id: string };
    await P.setRolePermission(null, { role: ROLES.HR, module: 'Goal', actions: ['VIEW'] }, admin);

    await expect(G.listGoals(null, {}, hr)).resolves.toHaveLength(1);
    await expect(G.createGoal(null, { input: goalInput }, hr)).rejects.toThrow(
      /may not create Goal/,
    );
    await expect(G.updateGoal(null, { id: created.id, input: goalInput }, hr)).rejects.toThrow(
      /may not edit/,
    );
    await expect(G.deleteGoal(null, { id: created.id }, hr)).rejects.toThrow(/may not delete/);
    expect(await GoalModel.countDocuments()).toBe(1);
  });

  it('an empty action list blocks the role from the module entirely; clearing restores it', async () => {
    await P.setRolePermission(null, { role: ROLES.HR, module: 'Goal', actions: [] }, admin);
    await expect(G.listGoals(null, {}, hr)).rejects.toThrow(/may not view/);

    await P.clearRolePermission(null, { role: ROLES.HR, module: 'Goal' }, admin);
    await expect(G.listGoals(null, {}, hr)).resolves.toEqual([]);
  });

  it('ADMIN is never restricted and cannot be restricted', async () => {
    await P.setRolePermission(null, { role: ROLES.HR, module: 'Goal', actions: [] }, admin);
    await expect(G.createGoal(null, { input: goalInput }, admin)).resolves.toBeDefined();
    await expect(
      P.setRolePermission(null, { role: ROLES.ADMIN, module: 'Goal', actions: [] }, admin),
    ).rejects.toThrow(/ADMIN/);
  });

  it('a restriction on one role does not affect another role that also has access', async () => {
    await P.setRolePermission(
      null,
      { role: ROLES.HR, module: 'SalaryStructure', actions: ['VIEW'] },
      admin,
    );
    // FINANCE shares the payroll module and has no restriction row, so it keeps full access.
    const { payrollResolvers } = await import('../../src/modules/payroll');
    const create = (payrollResolvers.Mutation as unknown as Record<string, Resolver>)
      .createSalaryStructure;
    await expect(
      create(
        null,
        {
          input: {
            employeeId: 'e9',
            currency: 'INR',
            basic: 1,
            hra: 0,
            allowances: 0,
            deductions: 0,
            effectiveFrom: new Date(),
          },
        },
        as([ROLES.FINANCE]),
      ),
    ).resolves.toBeDefined();
    await expect(
      create(
        null,
        {
          input: {
            employeeId: 'e8',
            currency: 'INR',
            basic: 1,
            hra: 0,
            allowances: 0,
            deductions: 0,
            effectiveFrom: new Date(),
          },
        },
        hr,
      ),
    ).rejects.toThrow(/may not create/);
  });

  it('only ADMIN can read or change the matrix, and unknown modules are refused', async () => {
    await expect(P.listRolePermissions(null, {}, hr)).rejects.toThrow();
    await expect(
      P.setRolePermission(null, { role: ROLES.HR, module: 'Nope', actions: [] }, admin),
    ).rejects.toThrow(/Unknown module/);
    expect((await P.listPermissionModules(null, {}, admin)) as string[]).toEqual(
      expect.arrayContaining(['Goal', 'Announcement', 'SalaryStructure']),
    );
  });
});
