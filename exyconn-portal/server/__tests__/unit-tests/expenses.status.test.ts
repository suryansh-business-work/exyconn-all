import { expensesResolvers } from '../../src/modules/expenses';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};

interface DecidedClaim {
  status: string;
  approvedAmount: number | null;
  paidOn: Date | null;
}

const decide = (id: string, status: string, approvedAmount?: number) =>
  expensesResolvers.Mutation.setExpenseClaimStatus(
    null,
    { id, status, approvedAmount } as never,
    asFinance,
  ) as Promise<DecidedClaim>;

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

describe('setExpenseClaimStatus', () => {
  it('approves for the amount claimed when finance does not say otherwise', async () => {
    const claim = await seedClaim();

    const decided = await decide(claim.id, 'APPROVED');

    expect(decided).toMatchObject({ status: 'APPROVED', approvedAmount: 3_000, paidOn: null });
  });

  it('approves for less than was claimed, but never for more', async () => {
    const claim = await seedClaim();

    await expect(decide(claim.id, 'APPROVED', 2_500)).resolves.toMatchObject({
      approvedAmount: 2_500,
    });
    await expect(decide(claim.id, 'APPROVED', 9_000)).rejects.toThrow(/between 0 and the 3000/);
  });

  it('stamps paidOn only when the money goes out', async () => {
    const claim = await seedClaim({ status: 'APPROVED', approvedAmount: 2_500 });

    const paid = await decide(claim.id, 'PAID');

    expect(paid.status).toBe('PAID');
    expect(paid.approvedAmount).toBe(2_500);
    expect(paid.paidOn).toBeInstanceOf(Date);
  });

  it('tells the claimant what was decided', async () => {
    const claim = await seedClaim();

    await decide(claim.id, 'REJECTED');

    const [note] = await NotificationModel.find({ employeeId: 'emp-1' }).lean();
    expect(note?.title).toMatch(/rejected/i);
  });

  it('refuses to send a claim back to submitted', async () => {
    const claim = await seedClaim({ status: 'APPROVED' });

    await expect(decide(claim.id, 'SUBMITTED')).rejects.toThrow(/cannot be sent back/i);
  });

  it('is finance-only', async () => {
    const claim = await seedClaim();
    const asEmployee: GraphQLContext = {
      user: { id: 'emp-1', roles: [ROLES.EMPLOYEE], email: 'e@exyconn.com' },
    };

    await expect(
      expensesResolvers.Mutation.setExpenseClaimStatus(
        null,
        { id: claim.id, status: 'APPROVED' } as never,
        asEmployee,
      ),
    ).rejects.toThrow();
  });
});
