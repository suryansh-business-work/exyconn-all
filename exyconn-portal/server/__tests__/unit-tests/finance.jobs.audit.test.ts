import { Types } from 'mongoose';
import {
  financeCompanyResolvers,
  generateDueInvoices,
  markOverdueInvoices,
  chaseOverdueInvoices,
} from '../../src/modules/finance';
import { expensesResolvers } from '../../src/modules/expenses';
import { AuditLogModel, SYSTEM_ACTOR, entityLabelOf } from '../../src/modules/audit';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { RecurringInvoiceModel } from '../../src/modules/finance/recurring-invoice.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { runAsPlatform, runForOrganization } from '../../src/lib/tenant';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';
import { useTestOrganization } from '../helpers';

const organizationId = useTestOrganization();

// The chase goes through the template engine; there is no SMTP here.
jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<{ id: string }>;
const M = {
  ...financeCompanyResolvers.Mutation,
  ...expensesResolvers.Mutation,
} as unknown as Record<string, Resolver>;

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

/** One invoice, due `dueDaysAgo` whole days before NOW. */
const seedInvoice = (number: string, dueDaysAgo: number, extra: Record<string, unknown> = {}) =>
  InvoiceModel.create({
    number,
    clientId: 'client-1',
    clientName: 'Nimbus Ltd',
    amount: 1000,
    amountPaid: 0,
    currency: 'INR',
    status: 'SENT',
    issuedDate: new Date(NOW.getTime() - (dueDaysAgo + 30) * DAY),
    dueDate: new Date(NOW.getTime() - dueDaysAgo * DAY),
    ...extra,
  });

const systemRows = (module: string) =>
  AuditLogModel.find({ module, actorId: SYSTEM_ACTOR.id }).sort({ _id: 1 }).lean();

describe('background finance jobs write the change log as the system', () => {
  it('logs a retainer raised by the hourly tick, in the company it ran for', async () => {
    const otherCompany = String(new Types.ObjectId());
    await runForOrganization(otherCompany, async () => {
      await RecurringInvoiceModel.create({
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
      await generateDueInvoices(new Date('2026-03-02T00:00:00.000Z'));
    });

    const rows = await runAsPlatform(() =>
      AuditLogModel.find({ actorId: 'system' }).sort({ _id: 1 }).lean(),
    );
    expect(rows.map((row) => [row.module, row.action])).toEqual([
      ['Invoice', 'CREATE'],
      ['RecurringInvoice', 'UPDATE'],
    ]);
    expect(rows[0]).toMatchObject({ actorName: 'System', actorEmail: '', ip: '' });
    expect(rows[1].summary).toMatch(/^RecurringInvoice raised INV-/);
    expect(JSON.parse(rows[1].changes)).toEqual({
      nextRunAt: { from: '2026-03-01T00:00:00.000Z', to: '2026-04-01T00:00:00.000Z' },
    });
    for (const row of rows) {
      expect(String((row as { organizationId?: unknown }).organizationId)).toBe(otherCompany);
    }
    expect(await systemRows('Invoice')).toHaveLength(0);
  });

  it('logs each invoice the overdue sweep marks late or clears, with its status move', async () => {
    const late = await seedInvoice('INV-001', 5);
    await seedInvoice('INV-002', -5, { status: 'OVERDUE', amountPaid: 200 });
    await seedInvoice('INV-003', -5, { status: 'OVERDUE' });

    const result = await markOverdueInvoices(NOW);

    expect(result).toEqual({ marked: 1, cleared: 2, chased: 0 });
    const rows = await systemRows('Invoice');
    expect(
      rows.map((row) => [row.entityLabel, row.summary, JSON.parse(row.changes).status]),
    ).toEqual([
      ['INV-001', 'Overdue sweep set Invoice INV-001 to OVERDUE', { from: 'SENT', to: 'OVERDUE' }],
      [
        'INV-002',
        'Overdue sweep set Invoice INV-002 to PARTIALLY_PAID',
        { from: 'OVERDUE', to: 'PARTIALLY_PAID' },
      ],
      ['INV-003', 'Overdue sweep set Invoice INV-003 to SENT', { from: 'OVERDUE', to: 'SENT' }],
    ]);
    expect(rows[0].entityId).toBe(String(late._id));
    expect(String((rows[0] as { organizationId?: unknown }).organizationId)).toBe(organizationId);
  });

  it('logs nothing when the sweep finds nothing to move', async () => {
    await seedInvoice('INV-001', -5);

    await expect(markOverdueInvoices(NOW)).resolves.toEqual({ marked: 0, cleared: 0, chased: 0 });
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });

  it('logs each overdue reminder that went out', async () => {
    const client = await ClientModel.create({
      name: 'Nimbus Ltd',
      email: 'accounts@nimbus.test',
      company: 'Nimbus Ltd',
      status: 'ACTIVE',
    });
    const invoice = await seedInvoice('INV-009', 5, {
      status: 'OVERDUE',
      clientId: String(client._id),
    });

    await expect(chaseOverdueInvoices(NOW)).resolves.toBe(1);

    const [row] = await systemRows('Invoice');
    expect(row).toMatchObject({
      action: 'UPDATE',
      entityId: String(invoice._id),
      entityLabel: 'INV-009',
      summary: 'Sent the 3-day overdue reminder for Invoice INV-009 to accounts@nimbus.test',
      changes: '',
    });
  });
});

describe('entity labels for records without a name', () => {
  it('labels a bill by its vendor and a claim by its category', async () => {
    await M.createCompanyExpense(
      null,
      {
        input: {
          vendor: 'Acme Cloud',
          category: 'SOFTWARE',
          amount: 500,
          currency: 'INR',
          incurredOn: new Date('2026-09-01T00:00:00.000Z'),
          dueDate: new Date('2026-10-01T00:00:00.000Z'),
        },
      },
      asFinance,
    );
    await M.createExpenseClaim(
      null,
      {
        input: {
          employeeId: 'emp-1',
          category: 'Travel',
          description: 'Client visit',
          amount: 300,
          currency: 'INR',
          incurredOn: new Date('2026-09-12T00:00:00.000Z'),
          status: 'SUBMITTED',
        },
      },
      asFinance,
    );

    expect((await AuditLogModel.findOne({ module: 'CompanyExpense' }).lean())?.entityLabel).toBe(
      'Acme Cloud',
    );
    expect((await AuditLogModel.findOne({ module: 'ExpenseClaim' }).lean())?.entityLabel).toBe(
      'Travel',
    );
  });

  it('keeps the usual fields first and adds nothing for a module that names none', () => {
    expect(entityLabelOf({ name: 'Ops', vendor: 'Acme' }, ['vendor'])).toBe('Ops');
    expect(entityLabelOf({ category: 'Tools', description: 'All tools' })).toBe('');
  });
});
