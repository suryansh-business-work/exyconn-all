import { financeCompanyResolvers } from '../../../../src/modules/finance';
import { CompanyExpenseModel } from '../../../../src/modules/finance/company-expense.model';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { freezeClock, useTestOrganization } from '../../../helpers';

useTestOrganization();

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};
const asHr: GraphQLContext = {
  user: { id: 'hr-1', roles: [ROLES.HR], email: 'hr@exyconn.com' },
};

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const seedBill = () =>
  CompanyExpenseModel.create({
    vendor: 'Acme Cloud',
    category: 'SOFTWARE',
    amount: 900,
    currency: 'USD',
    incurredOn: day('2026-09-01'),
    dueDate: day('2026-10-01'),
  });

afterEach(() => jest.useRealTimers());

describe('markExpensePaid', () => {
  it('dates the payment today and names the user id when the session carries no email', async () => {
    freezeClock('2026-09-18T10:00:00.000Z');
    const bill = await seedBill();
    const noEmail = { user: { id: 'fin-7', roles: [ROLES.FINANCE] } } as unknown as GraphQLContext;

    const saved = await financeCompanyResolvers.Mutation.markExpensePaid(
      null,
      { id: bill._id.toHexString() },
      noEmail,
    );

    expect(saved).toMatchObject({
      id: bill._id.toHexString(),
      status: 'PAID',
      recordedBy: 'fin-7',
    });
    expect(saved.paidOn).toEqual(new Date('2026-09-18T10:00:00.000Z'));
  });

  it('refuses anybody outside finance and leaves the bill unpaid', async () => {
    const bill = await seedBill();

    await expect(
      financeCompanyResolvers.Mutation.markExpensePaid(null, { id: bill._id.toHexString() }, asHr),
    ).rejects.toThrow(/do not have access/);
    expect((await CompanyExpenseModel.findById(bill._id).lean())?.status).toBe('UNPAID');
  });
});

describe('companyFinance', () => {
  it('accepts a single-day period', async () => {
    const on = day('2026-09-15');

    const result = await financeCompanyResolvers.Query.companyFinance(
      null,
      { from: on, to: on },
      asFinance,
    );

    expect(result).toMatchObject({ from: on, to: on, invoiced: 0, byCategory: [] });
    expect(result.months.map((month) => month.month)).toEqual(['2026-09']);
  });

  it('counts an open invoice from before the ledger as owed in full', async () => {
    const invoice = await InvoiceModel.create({
      number: 'INV-OLD',
      clientId: 'client-1',
      amount: 4000,
      currency: 'USD',
      status: 'SENT',
      issuedDate: day('2025-01-10'),
      dueDate: day('2025-02-10'),
    });
    await InvoiceModel.collection.updateOne({ _id: invoice._id }, { $unset: { amountPaid: '' } });

    const result = await financeCompanyResolvers.Query.companyFinance(
      null,
      { from: day('2026-09-01'), to: day('2026-09-30') },
      asFinance,
    );

    expect(result.outstandingReceivable).toBe(4000);
  });

  it('is closed to anybody outside finance', async () => {
    await expect(
      financeCompanyResolvers.Query.companyFinance(
        null,
        { from: day('2026-09-01'), to: day('2026-09-30') },
        asHr,
      ),
    ).rejects.toThrow(/do not have access/);
  });
});
