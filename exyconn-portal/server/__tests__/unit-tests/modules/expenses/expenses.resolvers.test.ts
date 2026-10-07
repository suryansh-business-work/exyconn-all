import { expensesResolvers } from '../../../../src/modules/expenses';
import { ExpenseClaimModel } from '../../../../src/modules/expenses/expense.model';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<unknown>;
const Q = expensesResolvers.Query as unknown as Record<string, Resolver>;
const M = expensesResolvers.Mutation as unknown as Record<string, Resolver>;

const as = (id: string, roles: Role[]): GraphQLContext => ({
  user: { id, email: `${id}@exyconn.com`, roles },
});
const finance = as('fin-1', [ROLES.FINANCE]);
const employee = as('emp-1', [ROLES.EMPLOYEE]);

interface Claim {
  id: string;
  employeeId: string;
  status: string;
  approvedAmount: number | null;
  description: string;
}

const myClaim = (category = 'Travel') => ({
  category,
  description: 'Client visit',
  amount: 3_000,
  currency: 'INR',
  incurredOn: new Date('2026-09-12T00:00:00.000Z'),
  receiptUrl: null,
});

const consoleInput = (
  employeeId: string,
  status: string,
  approvedAmount: number | null = null,
) => ({
  ...myClaim(),
  employeeId,
  status,
  approvedAmount,
});

const seedClaim = (employeeId: string, extra: Record<string, unknown> = {}) =>
  ExpenseClaimModel.create({ ...myClaim(), employeeId, ...extra });

const notesFor = (employeeId: string) => NotificationModel.find({ employeeId }).lean();

describe('createMyExpenseClaim', () => {
  it('files the claim for the signed-in employee as SUBMITTED and confirms it', async () => {
    const created = (await M.createMyExpenseClaim(null, { input: myClaim() }, employee)) as Claim;

    expect(created).toMatchObject({ employeeId: 'emp-1', status: 'SUBMITTED' });
    expect(created.approvedAmount).toBeNull();
    expect(typeof created.id).toBe('string');

    const [note] = await notesFor('emp-1');
    expect(note?.title).toBe('Expense claim submitted: Travel');
    const audit = await AuditLogModel.findOne({ module: 'ExpenseClaim' }).lean();
    expect(audit).toMatchObject({ action: 'CREATE', summary: 'Submitted ExpenseClaim' });
    expect(audit?.entityId).toBe(created.id);
  });

  it('ignores an employee id or status smuggled into the input', async () => {
    const input = { ...myClaim(), employeeId: 'emp-2', status: 'PAID' };

    const created = (await M.createMyExpenseClaim(null, { input }, employee)) as Claim;

    expect(created).toMatchObject({ employeeId: 'emp-1', status: 'SUBMITTED' });
  });

  it('needs a signed-in caller', async () => {
    await expect(
      M.createMyExpenseClaim(null, { input: myClaim() }, { user: null }),
    ).rejects.toThrow('Authentication required');
    expect(await ExpenseClaimModel.countDocuments()).toBe(0);
  });
});

describe('myExpenseClaims', () => {
  it('lists only the caller’s own claims, newest first', async () => {
    await seedClaim('emp-1', { category: 'Older', incurredOn: new Date('2026-08-01') });
    await seedClaim('emp-1', { category: 'Newer', incurredOn: new Date('2026-09-01') });
    await seedClaim('emp-2', { category: 'Theirs' });

    const rows = (await Q.myExpenseClaims(null, {}, employee)) as { category: string }[];

    expect(rows.map((r) => r.category)).toEqual(['Newer', 'Older']);
  });
});

describe('finance console writes', () => {
  it('refuses finance filing a claim for themselves through the console', async () => {
    // The guard throws before the wrapped create starts, so it is called inside an async function.
    await expect(async () =>
      M.createExpenseClaim(null, { input: consoleInput('fin-1', 'APPROVED') }, finance),
    ).rejects.toThrow('You cannot edit your own ExpenseClaim for yourself.');
    expect(await ExpenseClaimModel.countDocuments()).toBe(0);
  });

  it('lets finance file a claim for somebody else', async () => {
    const created = (await M.createExpenseClaim(
      null,
      { input: consoleInput('emp-1', 'SUBMITTED') },
      finance,
    )) as Claim;

    expect(created.employeeId).toBe('emp-1');
  });

  it('refuses an edit to finance’s own stored claim even when the input names somebody else', async () => {
    const own = await seedClaim('fin-1');

    await expect(
      M.updateExpenseClaim(null, { id: own.id, input: consoleInput('emp-1', 'APPROVED') }, finance),
    ).rejects.toThrow('You cannot edit your own ExpenseClaim for yourself.');
    expect((await ExpenseClaimModel.findById(own.id).lean())?.status).toBe('SUBMITTED');
  });
});

describe('updateExpenseClaim', () => {
  it('tells the claimant the cleared amount when the status changes', async () => {
    const claim = await seedClaim('emp-1');

    const updated = (await M.updateExpenseClaim(
      null,
      { id: claim.id, input: consoleInput('emp-1', 'APPROVED', 2_500) },
      finance,
    )) as Claim;

    expect(updated.status).toBe('APPROVED');
    const [note] = await notesFor('emp-1');
    expect(note?.title).toBe('Expense claim approved: Travel');
    expect(note?.body).toBe('INR 2500 — your claim was approved.');
  });

  it('falls back to the claimed amount when no approved amount is sent', async () => {
    const claim = await seedClaim('emp-1');

    await M.updateExpenseClaim(
      null,
      { id: claim.id, input: consoleInput('emp-1', 'REJECTED') },
      finance,
    );

    const [note] = await notesFor('emp-1');
    expect(note?.body).toBe('INR 3000 — your claim was rejected.');
  });

  it('stays quiet when the status did not change', async () => {
    const claim = await seedClaim('emp-1');
    const input = { ...consoleInput('emp-1', 'SUBMITTED'), description: 'Taxi to client' };

    const updated = (await M.updateExpenseClaim(null, { id: claim.id, input }, finance)) as Claim;

    expect(updated.description).toBe('Taxi to client');
    expect(await notesFor('emp-1')).toHaveLength(0);
  });

  it('reports a claim that does not exist', async () => {
    const missing = '64b000000000000000000001';

    await expect(
      M.updateExpenseClaim(null, { id: missing, input: consoleInput('emp-1', 'PAID') }, finance),
    ).rejects.toThrow('ExpenseClaim not found');
    expect(await notesFor('emp-1')).toHaveLength(0);
  });
});

describe('setExpenseClaimStatus guard', () => {
  it('refuses finance deciding their own claim', async () => {
    const own = await seedClaim('fin-1');

    await expect(
      M.setExpenseClaimStatus(null, { id: own.id, status: 'APPROVED' }, finance),
    ).rejects.toThrow('You cannot approve an expense claim for yourself.');
    expect((await ExpenseClaimModel.findById(own.id).lean())?.status).toBe('SUBMITTED');
  });

  it('asks an anonymous caller to sign in', async () => {
    const claim = await seedClaim('emp-1');

    await expect(
      M.setExpenseClaimStatus(null, { id: claim.id, status: 'APPROVED' }, { user: null }),
    ).rejects.toThrow('Authentication required');
  });
});
