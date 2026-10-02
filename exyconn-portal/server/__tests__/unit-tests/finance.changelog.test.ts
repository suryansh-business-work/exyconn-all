import { financeChangeLogResolvers, FINANCE_AUDIT_MODULES } from '../../src/modules/finance';
import { AuditLogModel, auditResolvers } from '../../src/modules/audit';
import { RolePermissionModel } from '../../src/modules/permissions/permission.model';
import { PERMISSION_MODULES, invalidatePermissionCache } from '../../src/lib/permissions';
import { ROLES, type Role } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

useTestOrganization();

type Page = { rows: Array<{ id: string; module: string }>; totalCount: number };
type Stats = { total: number; counts: Array<{ field: string; buckets: unknown[] }> };
type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;

const Q = financeChangeLogResolvers.Query as unknown as Record<string, Resolver>;
const AUDIT = auditResolvers.Query as unknown as Record<string, Resolver>;

const as = (roles: Role[]): GraphQLContext => ({
  user: { id: 'u1', email: 'u@exyconn.com', roles },
});
const finance = as([ROLES.FINANCE]);

const firstPage = { page: 0, pageSize: 25 };
const paged = (ctx: GraphQLContext, input: object = firstPage) =>
  Q.listFinanceChangeLogPaged(null, { input }, ctx) as Promise<Page>;
const stats = (ctx: GraphQLContext) => Q.listFinanceChangeLogStats(null, {}, ctx) as Promise<Stats>;

const entry = (module: string, action = 'UPDATE') =>
  AuditLogModel.create({ module, action, summary: `${action} ${module}`, entityLabel: module });

beforeEach(async () => {
  invalidatePermissionCache();
  await entry('Invoice', 'CREATE');
  await entry('Payment', 'CREATE');
  await entry('ExpenseClaim');
  await entry('Budget', 'DELETE');
  await entry('User', 'LOGIN');
  await entry('Goal');
});

describe('finance change log', () => {
  it('lists only the finance modules, whatever else the log holds', async () => {
    const page = await paged(finance);

    expect(page.totalCount).toBe(4);
    expect(page.rows.map((row) => row.module).sort((a, b) => a.localeCompare(b))).toEqual([
      'Budget',
      'ExpenseClaim',
      'Invoice',
      'Payment',
    ]);
    expect(page.rows[0].id).toEqual(expect.any(String));
  });

  it('cannot be widened by a filter or a search that names another module', async () => {
    const filtered = await paged(finance, {
      ...firstPage,
      filters: [{ field: 'module', op: 'EQUALS', value: 'User' }],
    });
    const searched = await paged(finance, { ...firstPage, search: 'Goal' });

    expect(filtered.totalCount).toBe(0);
    expect(searched.totalCount).toBe(0);
  });

  it('narrows within finance with the grid filters', async () => {
    const page = await paged(finance, {
      ...firstPage,
      filters: [{ field: 'module', op: 'EQUALS', value: 'Payment' }],
    });

    expect(page.rows.map((row) => row.module)).toEqual(['Payment']);
  });

  it('counts the finance rows only, by action and by module', async () => {
    const result = await stats(finance);

    expect(result.total).toBe(4);
    const byAction = result.counts.find((count) => count.field === 'action');
    expect(byAction?.buckets).toEqual(
      expect.arrayContaining([
        { value: 'CREATE', count: 2 },
        { value: 'UPDATE', count: 1 },
        { value: 'DELETE', count: 1 },
      ]),
    );
  });

  it('leaves the admin audit log unscoped', async () => {
    const page = (await AUDIT.listAuditLogsPaged(
      null,
      { input: firstPage },
      as([ROLES.ADMIN]),
    )) as Page;
    const counts = (await AUDIT.listAuditLogsStats(null, {}, as([ROLES.ADMIN]))) as Stats;

    expect(page.totalCount).toBe(6);
    expect(counts.total).toBe(6);
  });

  it('is open to finance and admin, and to nobody else', async () => {
    await expect(paged(as([ROLES.ADMIN]))).resolves.toMatchObject({ totalCount: 4 });
    await expect(paged(as([ROLES.EMPLOYEE]))).rejects.toThrow();
    await expect(stats(as([ROLES.HR]))).rejects.toThrow();
  });

  it('obeys the permission matrix, where it is registered', async () => {
    expect(PERMISSION_MODULES.has('FinanceChangeLog')).toBe(true);
    await RolePermissionModel.create({
      role: ROLES.FINANCE,
      module: 'FinanceChangeLog',
      actions: [],
    });

    await expect(paged(finance)).rejects.toThrow(/may not view FinanceChangeLog/);
    await expect(stats(finance)).rejects.toThrow(/may not view FinanceChangeLog/);
  });

  it('covers every module the finance resolvers write under', () => {
    expect(FINANCE_AUDIT_MODULES).toEqual([
      'Invoice',
      'RecurringInvoice',
      'Payment',
      'CompanyExpense',
      'ExpenseClaim',
      'CostCenter',
      'Budget',
    ]);
  });
});
