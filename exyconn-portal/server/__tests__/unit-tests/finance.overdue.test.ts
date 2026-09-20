import {
  financeBillingResolvers,
  markOverdueInvoices,
  sweepOverdueInvoices,
  dunningStage,
  DUNNING_STAGE_DAYS,
} from '../../src/modules/finance';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { emailer } from '../../src/modules/email';
import { sweepReminders } from '../../src/modules/reminders';
import { NotificationModel } from '../../src/modules/notifications/notification.model';
import { UserModel } from '../../src/modules/admin/user.model';
import { ROLES } from '../../src/constants/roles';
import { useTestOrganization } from '../helpers';
import type { GraphQLContext } from '../../src/middleware/auth';

useTestOrganization({ currency: 'INR', locale: 'en-IN' });

// The chase goes through the template engine; there is no SMTP here.
jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const send = jest.mocked(emailer.send);

const asFinance: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

/** A client with an address to chase, and the id an invoice points at it by. */
async function seedClient(email = 'accounts@nimbus.test') {
  const client = await ClientModel.create({
    name: 'Nimbus Ltd',
    email,
    company: 'Nimbus Ltd',
    status: 'ACTIVE',
  });
  return String(client._id);
}

interface InvoiceFields {
  clientId?: string;
  amount?: number;
  amountPaid?: number;
  status?: string;
  /** Whole days before NOW the invoice fell due. Negative for a date still to come. */
  dueDaysAgo?: number;
  number?: string;
}

function seedInvoice(fields: InvoiceFields = {}) {
  const dueDaysAgo = fields.dueDaysAgo ?? 5;
  return InvoiceModel.create({
    number: fields.number ?? 'INV-001',
    clientId: fields.clientId ?? 'client-1',
    clientName: 'Nimbus Ltd',
    amount: fields.amount ?? 1000,
    amountPaid: fields.amountPaid ?? 0,
    currency: 'INR',
    status: fields.status ?? 'SENT',
    issuedDate: new Date(NOW.getTime() - (dueDaysAgo + 30) * DAY),
    dueDate: new Date(NOW.getTime() - dueDaysAgo * DAY),
  });
}

const statusOf = async (id: unknown) => (await InvoiceModel.findById(id).lean())?.status;

const pay = (invoiceId: string, amount: number) =>
  financeBillingResolvers.Mutation.recordPayment(
    null,
    { input: { invoiceId, amount, method: 'BANK_TRANSFER' } },
    asFinance,
  );

async function seedFinanceUser() {
  const user = await UserModel.create({
    name: 'Ravi Menon',
    email: 'ravi@exyconn.com',
    passwordHash: 'x',
    roles: [ROLES.FINANCE],
    isActive: true,
  });
  return String(user._id);
}

describe('marking an invoice overdue', () => {
  it('declares a sent invoice overdue once its due date has passed', async () => {
    const invoice = await seedInvoice({ dueDaysAgo: 5 });

    const result = await markOverdueInvoices(NOW);

    expect(result.marked).toBe(1);
    expect(await statusOf(invoice._id)).toBe('OVERDUE');
  });

  it('declares a part-paid invoice overdue too — the rest of it is still late', async () => {
    const invoice = await seedInvoice({ status: 'PARTIALLY_PAID', amountPaid: 400 });

    await markOverdueInvoices(NOW);

    expect(await statusOf(invoice._id)).toBe('OVERDUE');
  });

  it('leaves an invoice that fell due this morning alone, as the ageing report does', async () => {
    // Lateness is floored to whole days everywhere else; a status that disagreed with the
    // CURRENT band would put the same invoice in two places on one screen.
    const invoice = await InvoiceModel.create({
      number: 'INV-TODAY',
      clientId: 'client-1',
      amount: 500,
      currency: 'INR',
      status: 'SENT',
      issuedDate: new Date(NOW.getTime() - 30 * DAY),
      dueDate: new Date(NOW.getTime() - 2 * 60 * 60 * 1000),
    });

    await markOverdueInvoices(NOW);

    expect(await statusOf(invoice._id)).toBe('SENT');
  });

  it('never touches a draft, a paid invoice or one with nothing left owing', async () => {
    const draft = await seedInvoice({ number: 'INV-D', status: 'DRAFT' });
    const paid = await seedInvoice({ number: 'INV-P', status: 'PAID', amountPaid: 1000 });
    const settled = await seedInvoice({ number: 'INV-S', status: 'SENT', amountPaid: 1000 });

    const result = await markOverdueInvoices(NOW);

    expect(result.marked).toBe(0);
    expect(await statusOf(draft._id)).toBe('DRAFT');
    expect(await statusOf(paid._id)).toBe('PAID');
    expect(await statusOf(settled._id)).toBe('SENT');
  });

  it('takes an invoice back out of overdue when the due date is pushed out', async () => {
    const untouched = await seedInvoice({ number: 'INV-A', status: 'OVERDUE', dueDaysAgo: -10 });
    const part = await seedInvoice({
      number: 'INV-B',
      status: 'OVERDUE',
      amountPaid: 250,
      dueDaysAgo: -10,
    });

    const result = await markOverdueInvoices(NOW);

    expect(result.cleared).toBe(2);
    expect(await statusOf(untouched._id)).toBe('SENT');
    expect(await statusOf(part._id)).toBe('PARTIALLY_PAID');
  });
});

describe('paying an overdue invoice', () => {
  it('clears it the moment the balance is settled', async () => {
    const invoice = await seedInvoice();
    await markOverdueInvoices(NOW);

    await pay(String(invoice._id), 1000);

    expect(await statusOf(invoice._id)).toBe('PAID');
  });

  it('keeps it overdue on a part payment, rather than quietly un-overdueing it', async () => {
    const invoice = await seedInvoice();
    await markOverdueInvoices(NOW);

    await pay(String(invoice._id), 100);

    expect(await statusOf(invoice._id)).toBe('OVERDUE');
  });
});

describe('the dunning stages', () => {
  it('reports nothing until the first stage, then the latest stage reached', () => {
    expect(DUNNING_STAGE_DAYS).toEqual([3, 14, 30]);
    expect(dunningStage(0)).toBeNull();
    expect(dunningStage(2)).toBeNull();
    expect(dunningStage(3)).toBe(3);
    expect(dunningStage(13)).toBe(3);
    expect(dunningStage(14)).toBe(14);
    expect(dunningStage(29)).toBe(14);
    expect(dunningStage(30)).toBe(30);
    // An invoice first seen months late gets the last letter, not all three at once.
    expect(dunningStage(400)).toBe(30);
  });
});

describe('chasing an overdue invoice', () => {
  beforeEach(() => send.mockClear());

  it('emails the customer once at a stage, however often it sweeps', async () => {
    const clientId = await seedClient();
    await seedInvoice({ clientId, dueDaysAgo: 5 });

    const first = await sweepOverdueInvoices(NOW);
    const second = await sweepOverdueInvoices(NOW);

    expect(first.chased).toBe(1);
    expect(second.chased).toBe(0);
    expect(send).toHaveBeenCalledTimes(1);
    const [letter] = send.mock.calls[0];
    expect(letter.template).toBe('invoice-overdue');
    expect(letter.to).toBe('accounts@nimbus.test');
    expect(letter.variables.daysLate).toBe('5');
    expect(letter.variables.balanceDue).toContain('1,000');
  });

  it('writes again at the next stage, and only the next one', async () => {
    const clientId = await seedClient();
    await seedInvoice({ clientId, dueDaysAgo: 5 });
    await sweepOverdueInvoices(NOW);

    const fortnight = await sweepOverdueInvoices(new Date(NOW.getTime() + 10 * DAY));
    const again = await sweepOverdueInvoices(new Date(NOW.getTime() + 12 * DAY));

    expect(fortnight.chased).toBe(1);
    expect(again.chased).toBe(0);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('never chases an invoice that has been paid', async () => {
    const clientId = await seedClient();
    const invoice = await seedInvoice({ clientId, dueDaysAgo: 40 });
    await markOverdueInvoices(NOW);
    await pay(String(invoice._id), 1000);

    const result = await sweepOverdueInvoices(NOW);

    expect(result.chased).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('chases only what is still owed after a part payment', async () => {
    const clientId = await seedClient();
    const invoice = await seedInvoice({ clientId, dueDaysAgo: 40 });
    await markOverdueInvoices(NOW);
    await pay(String(invoice._id), 750);

    await sweepOverdueInvoices(NOW);

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].variables.balanceDue).toContain('250');
  });

  it('says nothing to a client with no email address on file', async () => {
    await seedInvoice({ clientId: 'not-a-client', dueDaysAgo: 40 });

    const result = await sweepOverdueInvoices(NOW);

    expect(result.chased).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('what finance is told', () => {
  it('notifies the finance team once per invoice, not once per sweep', async () => {
    const employeeId = await seedFinanceUser();
    await seedInvoice({ dueDaysAgo: 5 });
    await markOverdueInvoices(NOW);

    const first = await sweepReminders(NOW);
    const second = await sweepReminders(new Date(NOW.getTime() + DAY));

    expect(first.sent).toBe(1);
    expect(second.sent).toBe(0);
    const notices = await NotificationModel.find({ employeeId }).lean();
    expect(notices).toHaveLength(1);
    expect(notices[0].title).toBe('Invoice INV-001 is overdue');
    expect(notices[0].kind).toBe('FINANCE');
  });

  it('says nothing about an invoice that is not overdue', async () => {
    await seedFinanceUser();
    await seedInvoice({ dueDaysAgo: -10 });

    const result = await sweepReminders(NOW);

    expect(result.sent).toBe(0);
    expect(await NotificationModel.countDocuments()).toBe(0);
  });
});
