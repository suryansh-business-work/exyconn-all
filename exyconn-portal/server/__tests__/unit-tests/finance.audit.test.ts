import {
  financeBillingResolvers,
  financeCompanyResolvers,
  financeResolvers,
  recurringInvoiceResolvers,
} from '../../src/modules/finance';
import { expensesResolvers } from '../../src/modules/expenses';
import { AuditLogModel } from '../../src/modules/audit';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { CompanyExpenseModel } from '../../src/modules/finance/company-expense.model';
import { RecurringInvoiceModel } from '../../src/modules/finance/recurring-invoice.model';
import { ExpenseClaimModel } from '../../src/modules/expenses/expense.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { DealModel } from '../../src/modules/crm/deal.model';
import { ProjectModel } from '../../src/modules/projects/projects.model';
import { trackerBillingService } from '../../src/modules/tracker/tracker.billing.service';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

useTestOrganization();

// Sending an invoice goes through the template engine; there is no SMTP here.
jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<{ id: string }>;
const M = {
  ...financeResolvers.Mutation,
  ...financeBillingResolvers.Mutation,
  ...financeCompanyResolvers.Mutation,
  ...recurringInvoiceResolvers.Mutation,
  ...expensesResolvers.Mutation,
} as unknown as Record<string, Resolver>;

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: { id: 'emp-1', roles: [ROLES.EMPLOYEE], email: 'emp@exyconn.com' },
};

const DAY = 86_400_000;

const seedInvoice = (extra: Record<string, unknown> = {}) =>
  InvoiceModel.create({
    number: 'INV-001',
    clientId: 'client-1',
    clientName: 'Acme',
    amount: 1000,
    currency: 'INR',
    status: 'SENT',
    issuedDate: new Date(Date.now() - DAY),
    dueDate: new Date(Date.now() + 10 * DAY),
    ...extra,
  });

const seedClient = () =>
  ClientModel.create({
    name: 'Acme Ltd',
    email: 'billing@acme.com',
    phone: '000',
    company: 'Acme Ltd',
    status: 'ACTIVE',
  });

/** Every row the log holds for one module, oldest first, with `changes` parsed. */
async function logOf(module: string) {
  const rows = await AuditLogModel.find({ module }).sort({ createdAt: 1, _id: 1 }).lean();
  return rows.map((row) => ({ ...row, changes: row.changes ? JSON.parse(row.changes) : null }));
}

describe('finance mutations write the change log', () => {
  it('records a payment and what it did to the invoice', async () => {
    const invoice = await seedInvoice();

    const payment = await M.recordPayment(
      null,
      { input: { invoiceId: invoice._id.toHexString(), amount: 400, method: 'UPI' } },
      asFinance,
    );

    const [receipt] = await logOf('Payment');
    expect(receipt).toMatchObject({
      action: 'CREATE',
      entityId: payment.id,
      entityLabel: 'INV-001',
      summary: 'Recorded 400 INR against INV-001',
      actorEmail: 'ap@exyconn.com',
    });
    const [update] = await logOf('Invoice');
    expect(update).toMatchObject({
      action: 'UPDATE',
      entityId: invoice._id.toHexString(),
      summary: 'Payment recorded on Invoice INV-001',
      changes: {
        amountPaid: { from: 0, to: 400 },
        status: { from: 'SENT', to: 'PARTIALLY_PAID' },
      },
    });
  });

  it('records a send, with the status move only when a draft went out', async () => {
    const draft = await seedInvoice({ status: 'DRAFT' });
    const sent = await seedInvoice({ number: 'INV-002' });

    await M.sendInvoice(null, { id: draft._id.toHexString(), email: 'a@acme.com' }, asFinance);
    await M.sendInvoice(null, { id: sent._id.toHexString(), email: 'b@acme.com' }, asFinance);

    const [first, second] = await logOf('Invoice');
    expect(first).toMatchObject({
      action: 'UPDATE',
      entityLabel: 'INV-001',
      summary: 'Sent Invoice INV-001 to a@acme.com',
      changes: { status: { from: 'DRAFT', to: 'SENT' } },
    });
    expect(second).toMatchObject({ summary: 'Sent Invoice INV-002 to b@acme.com', changes: null });
  });

  it('records an invoice raised from a won deal', async () => {
    const client = await seedClient();
    const deal = await DealModel.create({
      title: 'Rollout',
      companyName: 'Acme Ltd',
      stage: 'WON',
      value: 1000,
      probability: 100,
      owner: 'Asha',
      clientId: client._id.toHexString(),
    });

    const invoice = await M.createInvoiceFromDeal(
      null,
      { dealId: deal._id.toHexString() },
      asFinance,
    );

    const [row] = await logOf('Invoice');
    expect(row).toMatchObject({
      action: 'CREATE',
      entityId: invoice.id,
      entityLabel: 'INV-0001',
      summary: 'Created Invoice INV-0001 from deal "Rollout"',
    });
  });

  it('records an invoice raised from tracked time', async () => {
    const client = await seedClient();
    const project = await ProjectModel.create({
      name: 'Portal',
      status: 'ACTIVE',
      clientId: client._id.toHexString(),
    });
    jest
      .spyOn(trackerBillingService, 'billingByProject')
      .mockResolvedValueOnce([
        { currency: 'USD', employees: [{ employeeName: 'asha', hours: 2, rate: 100 }] },
      ] as never);
    const from = new Date('2026-09-01T00:00:00.000Z');
    const to = new Date('2026-10-01T00:00:00.000Z');

    const invoice = await M.createInvoiceFromTimeLog(
      null,
      { projectId: project._id.toHexString(), from, to },
      asFinance,
    );

    const [row] = await logOf('Invoice');
    expect(row).toMatchObject({
      action: 'CREATE',
      entityId: invoice.id,
      summary: 'Created Invoice INV-0001 from project time (2026-09-01–2026-10-01)',
    });
  });

  it('records a bill being settled', async () => {
    const bill = await CompanyExpenseModel.create({
      vendor: 'Acme Cloud',
      category: 'SOFTWARE',
      amount: 500,
      currency: 'INR',
      incurredOn: new Date('2026-09-01T00:00:00.000Z'),
      dueDate: new Date('2026-10-01T00:00:00.000Z'),
    });
    const paidOn = new Date('2026-09-25T00:00:00.000Z');

    await M.markExpensePaid(null, { id: bill._id.toHexString(), paidOn }, asFinance);

    const [row] = await logOf('CompanyExpense');
    expect(row).toMatchObject({
      action: 'UPDATE',
      entityLabel: 'Acme Cloud',
      summary: 'Marked CompanyExpense from Acme Cloud paid',
      changes: {
        status: { from: 'UNPAID', to: 'PAID' },
        paidOn: { from: null, to: paidOn.toISOString() },
      },
    });
  });

  it('records a retainer run by hand: the invoice and the schedule moving on', async () => {
    const schedule = await RecurringInvoiceModel.create({
      name: 'Acme retainer',
      clientId: 'client-1',
      clientName: 'Acme Ltd',
      lines: [{ description: 'Support', quantity: 1, rate: 100, taxPercent: 0 }],
      currency: 'INR',
      frequency: 'MONTHLY',
      startDate: new Date('2026-03-01T00:00:00.000Z'),
      nextRunAt: new Date('2026-03-01T00:00:00.000Z'),
      dueDays: 30,
      active: true,
    });

    await M.runRecurringInvoiceNow(null, { id: schedule._id.toHexString() }, asFinance);

    const invoice = await InvoiceModel.findOne().lean();
    const [created] = await logOf('Invoice');
    expect(created).toMatchObject({
      action: 'CREATE',
      entityId: String(invoice?._id),
      summary: `Created Invoice ${invoice?.number} from recurring schedule "Acme retainer"`,
    });
    const [run] = await logOf('RecurringInvoice');
    expect(run).toMatchObject({
      action: 'UPDATE',
      entityId: schedule._id.toHexString(),
      entityLabel: 'Acme retainer',
      summary: `RecurringInvoice raised ${invoice?.number}`,
      changes: {
        nextRunAt: { from: '2026-03-01T00:00:00.000Z', to: '2026-04-01T00:00:00.000Z' },
      },
    });
  });

  it("records a claim filed by an employee and finance's decision on it", async () => {
    const claim = await M.createMyExpenseClaim(
      null,
      {
        input: {
          category: 'Travel',
          description: 'Client visit',
          amount: 300,
          currency: 'INR',
          incurredOn: new Date('2026-09-12T00:00:00.000Z'),
        },
      },
      asEmployee,
    );
    await M.setExpenseClaimStatus(null, { id: claim.id, status: 'APPROVED' }, asFinance);

    const [filed, decided] = await logOf('ExpenseClaim');
    expect(filed).toMatchObject({
      action: 'CREATE',
      entityId: claim.id,
      entityLabel: 'Travel',
      summary: 'Submitted ExpenseClaim',
      actorEmail: 'emp@exyconn.com',
    });
    expect(decided).toMatchObject({
      action: 'UPDATE',
      summary: 'Set ExpenseClaim to APPROVED',
      changes: {
        status: { from: 'SUBMITTED', to: 'APPROVED' },
        approvedAmount: { from: null, to: 300 },
      },
    });
    expect(await ExpenseClaimModel.countDocuments()).toBe(1);
  });
});
