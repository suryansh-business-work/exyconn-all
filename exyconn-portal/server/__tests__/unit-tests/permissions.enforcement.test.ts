// A module registers itself in PERMISSION_MODULES when its resolvers are built, so the
// modules this file restricts have to be imported. The hand-written names (TechConfig,
// AuditLog, …) are seeded by lib/permissions itself and need no import.
import '../../src/modules/goals';
import '../../src/modules/announcements';
import { techResolvers } from '../../src/modules/tech';
import { auditResolvers } from '../../src/modules/audit';
import { expensesResolvers } from '../../src/modules/expenses';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { permissionsResolvers } from '../../src/modules/permissions';
import { invalidatePermissionCache } from '../../src/lib/permissions';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;

const P = { ...permissionsResolvers.Query, ...permissionsResolvers.Mutation } as unknown as Record<
  string,
  Resolver
>;
const TECH = techResolvers.Query as unknown as Record<string, Resolver>;
const AUDIT = auditResolvers.Query as unknown as Record<string, Resolver>;
const EXPENSES = expensesResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (roles: string[]) =>
  ({ user: { id: 'u1', email: 'u@x.com', roles } }) as unknown as GraphQLContext;
const admin = as([ROLES.ADMIN]);
const tech = as([ROLES.TECH]);
const finance = as([ROLES.FINANCE]);
const hr = as([ROLES.HR]);

const restrict = (role: string, module: string, actions: string[]) =>
  P.setRolePermission(null, { role, module, actions }, admin);

const claim = () =>
  ExpenseClaimModel.create({
    employeeId: 'e1',
    category: 'Travel',
    description: 'Taxi',
    amount: 500,
    currency: 'INR',
    incurredOn: new Date(),
    status: 'SUBMITTED',
  });

beforeEach(() => invalidatePermissionCache());

describe('the hand-written half of the API', () => {
  it('registers its module names, so the admin matrix can restrict them', async () => {
    expect((await P.listPermissionModules(null, {}, admin)) as string[]).toEqual(
      expect.arrayContaining([
        'AppSettings',
        'AuditLog',
        'Branding',
        'Infrastructure',
        'SalarySlip',
        'TechConfig',
        'Tracker',
        'User',
        'WebsiteSubmission',
      ]),
    );
  });

  it('refuses a hand-written query when the role has VIEW switched off', async () => {
    await expect(TECH.listEmailConfigs(null, {}, tech)).resolves.toEqual([]);

    await restrict(ROLES.TECH, 'TechConfig', ['CREATE']);
    await expect(TECH.listEmailConfigs(null, {}, tech)).rejects.toThrow(/may not view TechConfig/);
    // ADMIN is never restricted, whatever the matrix says.
    await expect(TECH.listEmailConfigs(null, {}, admin)).resolves.toEqual([]);
  });

  it('leaves a hand-written query alone while no row exists for the role', async () => {
    await restrict(ROLES.HR, 'TechConfig', []);
    await expect(TECH.listEmailConfigs(null, {}, tech)).resolves.toEqual([]);
    await expect(AUDIT.listAuditLogsStats(null, {}, admin)).resolves.toBeDefined();
  });
});

describe('APPROVE', () => {
  it('lets an unrestricted role decide a claim', async () => {
    const row = await claim();
    const decided = (await EXPENSES.setExpenseClaimStatus(
      null,
      { id: String(row._id), status: 'APPROVED' },
      finance,
    )) as { status: string };
    expect(decided.status).toBe('APPROVED');
  });

  it('refuses the decision when APPROVE is off, even with EDIT on', async () => {
    const row = await claim();
    await restrict(ROLES.FINANCE, 'ExpenseClaim', ['VIEW', 'EDIT']);

    await expect(
      EXPENSES.setExpenseClaimStatus(null, { id: String(row._id), status: 'APPROVED' }, finance),
    ).rejects.toThrow(/may not approve ExpenseClaim/);
    const after = await ExpenseClaimModel.findById(row._id).lean();
    expect(after?.status).toBe('SUBMITTED');
  });
});

describe('myPermissions', () => {
  it('reports a restricted role action by action', async () => {
    await restrict(ROLES.HR, 'Goal', ['VIEW', 'EDIT']);
    const rows = (await P.myPermissions(null, {}, hr)) as {
      module: string;
      view: boolean;
      create: boolean;
      edit: boolean;
      approve: boolean;
      export: boolean;
    }[];

    const goal = rows.find((row) => row.module === 'Goal');
    expect(goal).toMatchObject({ view: true, edit: true, create: false, approve: false });
    // A module with no row is untouched, which is what keeps existing deployments working.
    expect(rows.find((row) => row.module === 'Announcement')?.create).toBe(true);
  });

  it('is all-true for ADMIN', async () => {
    await restrict(ROLES.HR, 'Goal', []);
    const rows = (await P.myPermissions(null, {}, admin)) as Record<string, boolean>[];
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.view && row.create && row.approve && row.export)).toBe(true);
  });
});

describe('canExport', () => {
  it('is false once EXPORT is switched off, and true otherwise', async () => {
    await expect(P.canExport(null, { module: 'Goal' }, hr)).resolves.toBe(true);

    await restrict(ROLES.HR, 'Goal', ['VIEW']);
    await expect(P.canExport(null, { module: 'Goal' }, hr)).resolves.toBe(false);
    await expect(P.canExport(null, { module: 'Goal' }, admin)).resolves.toBe(true);
  });

  it('refuses a module the server does not know', async () => {
    await expect(P.canExport(null, { module: 'Nope' }, hr)).rejects.toThrow(/Unknown module/);
  });
});
