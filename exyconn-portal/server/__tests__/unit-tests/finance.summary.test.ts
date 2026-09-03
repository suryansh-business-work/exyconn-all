import { financeCompanyResolvers } from '../../src/modules/finance';
import { monthKey, monthLabel, monthsBetween } from '../../src/modules/finance/finance.summary';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { CompanyExpenseModel } from '../../src/modules/finance/company-expense.model';
import { SalarySlipModel } from '../../src/modules/employee/salarySlip.model';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { financeBillingResolvers } from '../../src/modules/finance';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asFinance: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.FINANCE], email: 'cfo@exyconn.com' },
};

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

/** The whole of September 2026 — the period every test below asks about. */
const SEPTEMBER = { from: day('2026-09-01'), to: day('2026-09-30') };

const summary = (period = SEPTEMBER) =>
  financeCompanyResolvers.Query.companyFinance(null, period, asFinance);

function seedInvoice(amount: number, issuedOn: string, status = 'SENT') {
  return InvoiceModel.create({
    number: `INV-${issuedOn}-${amount}`,
    clientId: 'client-1',
    amount,
    currency: 'INR',
    status,
    issuedDate: day(issuedOn),
    dueDate: day('2026-10-15'),
  });
}

function seedBill(amount: number, incurredOn: string, extra: Record<string, unknown> = {}) {
  return CompanyExpenseModel.create({
    vendor: 'Acme Cloud',
    category: 'SOFTWARE',
    amount,
    currency: 'INR',
    incurredOn: day(incurredOn),
    dueDate: day('2026-10-01'),
    ...extra,
  });
}

describe('month bucketing', () => {
  it('keys a date by its UTC month', () => {
    expect(monthKey(day('2026-09-04'))).toBe('2026-09');
    expect(monthKey(day('2026-01-31'))).toBe('2026-01');
  });

  it('labels a key the way a person reads it', () => {
    expect(monthLabel('2026-09')).toBe('Sep 2026');
  });

  it('lists every month a period touches, so a quiet month shows as a gap at zero', () => {
    expect(monthsBetween(day('2026-07-15'), day('2026-10-02'))).toEqual([
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
  });

  it('handles a period inside one month, and one crossing a year', () => {
    expect(monthsBetween(day('2026-09-02'), day('2026-09-28'))).toEqual(['2026-09']);
    expect(monthsBetween(day('2026-12-01'), day('2027-01-31'))).toEqual(['2026-12', '2027-01']);
  });
});

describe('companyFinance — accrual', () => {
  it('reports zeroes for a period with nothing in it', async () => {
    await expect(summary()).resolves.toMatchObject({
      invoiced: 0,
      totalCost: 0,
      profit: 0,
      collected: 0,
    });
  });

  it('counts what was invoiced, and leaves drafts out of it', async () => {
    await seedInvoice(100_000, '2026-09-05');
    // A draft has not gone to anybody; counting it as revenue would invent income.
    await seedInvoice(50_000, '2026-09-06', 'DRAFT');

    await expect(summary()).resolves.toMatchObject({ invoiced: 100_000 });
  });

  it('adds bills, payroll and approved claims into one cost figure', async () => {
    await seedBill(20_000, '2026-09-10');
    await SalarySlipModel.create({
      employeeId: 'emp-1',
      month: 9,
      year: 2026,
      currency: 'INR',
      gross: 60_000,
      deductions: 5_000,
      net: 55_000,
      issuedDate: day('2026-09-30'),
    });
    await ExpenseClaimModel.create({
      employeeId: 'emp-1',
      category: 'Travel',
      description: 'Client visit',
      amount: 3_000,
      currency: 'INR',
      incurredOn: day('2026-09-12'),
      status: 'APPROVED',
    });

    await expect(summary()).resolves.toMatchObject({
      expenses: 20_000,
      payroll: 55_000,
      reimbursements: 3_000,
      totalCost: 78_000,
    });
  });

  it('leaves a rejected claim out — it never became a company cost', async () => {
    await ExpenseClaimModel.create({
      employeeId: 'emp-1',
      category: 'Travel',
      description: 'Declined',
      amount: 9_000,
      currency: 'INR',
      incurredOn: day('2026-09-12'),
      status: 'REJECTED',
    });

    await expect(summary()).resolves.toMatchObject({ reimbursements: 0 });
  });

  it('states profit as invoiced minus every cost', async () => {
    await seedInvoice(100_000, '2026-09-05');
    await seedBill(30_000, '2026-09-10');

    await expect(summary()).resolves.toMatchObject({ profit: 70_000 });
  });

  it('ignores anything outside the period', async () => {
    await seedInvoice(100_000, '2026-08-31');
    await seedBill(40_000, '2026-10-01');

    await expect(summary()).resolves.toMatchObject({ invoiced: 0, expenses: 0 });
  });
});

describe('companyFinance — cash', () => {
  it('counts a bill in the month it was PAID, not the month it was incurred', async () => {
    // The two dates are what keep cash flow honest: this bill is August cost, September cash.
    await seedBill(25_000, '2026-08-20', { status: 'PAID', paidOn: day('2026-09-03') });

    const result = await summary();
    expect(result.expenses).toBe(0);
    expect(result.paidOut).toBe(25_000);
  });

  it('nets cash in against cash out', async () => {
    const invoice = await seedInvoice(80_000, '2026-09-01');
    await financeBillingResolvers.Mutation.recordPayment(
      null,
      {
        input: {
          invoiceId: String(invoice._id),
          amount: 50_000,
          method: 'BANK_TRANSFER',
          receivedAt: day('2026-09-15'),
        },
      },
      asFinance,
    );
    await seedBill(20_000, '2026-09-02', { status: 'PAID', paidOn: day('2026-09-20') });

    await expect(summary()).resolves.toMatchObject({
      collected: 50_000,
      paidOut: 20_000,
      netCash: 30_000,
    });
  });
});

describe('companyFinance — position', () => {
  it('counts what is owed today, even when it was raised outside the period', async () => {
    // An invoice from last quarter that nobody has paid is money owed NOW; a receivables
    // figure that silently excluded it would be the most dangerous number on the page.
    await seedInvoice(70_000, '2026-05-01');

    await expect(summary()).resolves.toMatchObject({ outstandingReceivable: 70_000 });
  });

  it('separates what is merely payable from what is already late', async () => {
    await seedBill(10_000, '2026-09-01', { dueDate: day('2026-01-01') });
    await seedBill(4_000, '2026-09-01', { dueDate: day('2099-01-01') });

    await expect(summary()).resolves.toMatchObject({
      outstandingPayable: 14_000,
      overduePayable: 10_000,
    });
  });

  it('stops counting a bill once it is settled', async () => {
    await seedBill(10_000, '2026-09-01', { status: 'PAID', paidOn: day('2026-09-05') });

    await expect(summary()).resolves.toMatchObject({ outstandingPayable: 0 });
  });
});

describe('companyFinance — breakdown and trend', () => {
  it('ranks spend by category, biggest first, and omits the empty ones', async () => {
    await seedBill(5_000, '2026-09-02', { category: 'SOFTWARE' });
    await seedBill(40_000, '2026-09-03', { category: 'RENT' });
    await seedBill(1_000, '2026-09-04', { category: 'SOFTWARE' });

    const { byCategory } = await summary();
    expect(byCategory).toEqual([
      { key: 'RENT', label: 'Rent', amount: 40_000 },
      { key: 'SOFTWARE', label: 'Software', amount: 6_000 },
    ]);
  });

  it('gives every month in the period a point, including the empty ones', async () => {
    await seedInvoice(10_000, '2026-07-04');
    await seedBill(4_000, '2026-09-04');

    const { months } = await summary({ from: day('2026-07-01'), to: day('2026-09-30') });

    expect(months.map((m) => m.month)).toEqual(['2026-07', '2026-08', '2026-09']);
    expect(months[0]).toMatchObject({ revenue: 10_000, cost: 0, profit: 10_000 });
    expect(months[1]).toMatchObject({ revenue: 0, cost: 0, profit: 0 });
    expect(months[2]).toMatchObject({ revenue: 0, cost: 4_000, profit: -4_000 });
  });

  it('keeps the trend on the same basis as the headline, so they cannot disagree', async () => {
    await seedInvoice(90_000, '2026-09-05');
    await seedBill(30_000, '2026-09-06');

    const result = await summary();
    const trend = result.months.reduce((sum, month) => sum + month.profit, 0);
    expect(trend).toBe(result.profit);
  });
});

describe('markExpensePaid', () => {
  const settle = (id: string, paidOn?: Date) =>
    financeCompanyResolvers.Mutation.markExpensePaid(null, { id, paidOn }, asFinance);

  it('records when the money left and moves the bill to PAID', async () => {
    const bill = await seedBill(12_000, '2026-09-01');

    await settle(String(bill._id), day('2026-09-25'));

    const after = await CompanyExpenseModel.findById(bill._id).lean();
    expect(after?.status).toBe('PAID');
    expect(after?.paidOn).toEqual(day('2026-09-25'));
    expect(after?.recordedBy).toBe('cfo@exyconn.com');
  });

  it('refuses to settle the same bill twice', async () => {
    const bill = await seedBill(12_000, '2026-09-01');
    await settle(String(bill._id));

    await expect(settle(String(bill._id))).rejects.toThrow(/already settled/i);
  });

  it('refuses a bill that does not exist', async () => {
    await expect(settle('64b7f9c2f1a2b3c4d5e6f7a8')).rejects.toThrow(/Expense/i);
  });
});

describe('companyFinance guards', () => {
  it('refuses a period that runs backwards', async () => {
    await expect(summary({ from: day('2026-09-30'), to: day('2026-09-01') })).rejects.toThrow(
      /must not be after/i,
    );
  });
});
