import { setExpenseClaimStatus } from '../../../../src/modules/expenses/expense-status';
import { ExpenseClaimModel } from '../../../../src/modules/expenses/expense.model';
import { NotificationModel } from '../../../../src/modules/notifications/notification.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};

interface DecidedClaim {
  status: string;
  approvedAmount: number | null;
  paidOn: Date | null;
}

type Status = Parameters<typeof setExpenseClaimStatus>[1]['status'];

const decide = (id: string, status: Status, approvedAmount?: number) =>
  setExpenseClaimStatus(null, { id, status, approvedAmount }, asFinance) as Promise<DecidedClaim>;

const seedClaim = (extra: Record<string, unknown> = {}) =>
  ExpenseClaimModel.create({
    employeeId: 'emp-1',
    category: 'Travel',
    description: 'Client visit',
    amount: 3_000,
    currency: 'INR',
    incurredOn: new Date('2026-09-12T00:00:00.000Z'),
    ...extra,
  });

const noteFor = async () => {
  const [note] = await NotificationModel.find({ employeeId: 'emp-1' }).lean();
  return note;
};

describe('setExpenseClaimStatus boundaries', () => {
  it('reports a claim that does not exist', async () => {
    await expect(decide('64b000000000000000000002', 'APPROVED')).rejects.toThrow(
      'Expense claim not found',
    );
  });

  it('refuses a negative approved amount and keeps the claim as it was', async () => {
    const claim = await seedClaim();

    await expect(decide(claim.id, 'APPROVED', -1)).rejects.toThrow(/between 0 and the 3000/);

    const stored = await ExpenseClaimModel.findById(claim.id).lean();
    expect(stored).toMatchObject({ status: 'SUBMITTED', approvedAmount: null });
  });

  it('accepts both ends of the range: nothing, and the full claim', async () => {
    const claim = await seedClaim();

    await expect(decide(claim.id, 'APPROVED', 0)).resolves.toMatchObject({ approvedAmount: 0 });
    await expect(decide(claim.id, 'APPROVED', 3_000)).resolves.toMatchObject({
      approvedAmount: 3_000,
    });
  });
});

describe('setExpenseClaimStatus outcomes', () => {
  it('pays a claim that was never explicitly approved for the full amount', async () => {
    const claim = await seedClaim();

    const paid = await decide(claim.id, 'PAID');

    expect(paid).toMatchObject({ status: 'PAID', approvedAmount: 3_000 });
    expect(paid.paidOn).toBeInstanceOf(Date);
    const note = await noteFor();
    expect(note?.title).toBe('Expense claim paid: Travel');
    expect(note?.body).toBe('INR 3000 — Client visit');
    expect(note?.link).toBe('/me/expenses');
  });

  it('rejects without inventing an approved amount or a payment date', async () => {
    const claim = await seedClaim();

    const rejected = await decide(claim.id, 'REJECTED');

    expect(rejected).toMatchObject({ status: 'REJECTED', approvedAmount: null, paidOn: null });
    expect((await noteFor())?.body).toBe('INR 3000 — Client visit');
  });

  it('tells the claimant the cleared amount, not the claimed one', async () => {
    const claim = await seedClaim();

    await decide(claim.id, 'APPROVED', 1_200);

    const note = await noteFor();
    expect(note?.title).toBe('Expense claim approved: Travel');
    expect(note?.body).toBe('INR 1200 — Client visit');
  });

  it('records what changed in the audit log', async () => {
    const claim = await seedClaim();

    await decide(claim.id, 'APPROVED', 2_000);

    const row = await AuditLogModel.findOne({ module: 'ExpenseClaim' }).lean();
    expect(row).toMatchObject({
      action: 'UPDATE',
      entityId: claim.id,
      entityLabel: 'Travel',
      summary: 'Set ExpenseClaim to APPROVED',
      actorId: 'fin-1',
    });
    const changes = JSON.parse(row?.changes ?? '{}') as Record<string, unknown>;
    expect(changes).toMatchObject({
      status: { from: 'SUBMITTED', to: 'APPROVED' },
      approvedAmount: { from: null, to: 2_000 },
    });
    expect(changes).not.toHaveProperty('paidOn');
  });

  it('keeps the decision when the notification store fails', async () => {
    const claim = await seedClaim();
    const failing = jest
      .spyOn(NotificationModel, 'insertMany')
      .mockRejectedValueOnce(new Error('notification store down'));

    try {
      await expect(decide(claim.id, 'APPROVED')).resolves.toMatchObject({ status: 'APPROVED' });
      expect(failing).toHaveBeenCalledTimes(1);
      expect((await ExpenseClaimModel.findById(claim.id).lean())?.status).toBe('APPROVED');
    } finally {
      failing.mockRestore();
    }
  });
});
