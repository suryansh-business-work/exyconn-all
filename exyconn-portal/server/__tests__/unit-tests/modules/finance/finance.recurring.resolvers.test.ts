import { recurringInvoiceResolvers } from '../../../../src/modules/finance';
import { RecurringInvoiceModel } from '../../../../src/modules/finance/recurring-invoice.model';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { updateBranding } from '../../../../src/modules/branding/branding.service';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

type Row = {
  id: string;
  name: string;
  clientName: string;
  nextRunAt: Date;
  generatedCount: number;
  placeOfSupplyStateCode: string;
};
type Resolver = (p: unknown, a: unknown, c: GraphQLContext) => Promise<Row>;
const M = recurringInvoiceResolvers.Mutation as unknown as Record<string, Resolver>;
const R = recurringInvoiceResolvers.RecurringInvoice;

const asFinance: GraphQLContext = {
  user: { id: 'fin-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};
const asHr: GraphQLContext = {
  user: { id: 'hr-1', roles: [ROLES.HR], email: 'hr@exyconn.com' },
};

const START = new Date('2026-03-01T00:00:00.000Z');
const LINES = [{ description: 'Support retainer', quantity: 1, rate: 50_000, taxPercent: 18 }];

async function seedClient() {
  const client = await ClientModel.create({
    name: 'Priya',
    email: 'priya@acme.test',
    company: 'Acme',
    status: 'ACTIVE',
  });
  return String(client._id);
}

const input = (clientId: string, extra: Record<string, unknown> = {}) => ({
  name: 'Acme retainer',
  clientId,
  lines: LINES,
  currency: 'USD',
  frequency: 'MONTHLY',
  startDate: START,
  dueDays: 15,
  ...extra,
});

describe('RecurringInvoice field resolvers', () => {
  it('fills what an older schedule row comes back without', () => {
    expect(R.clientName({})).toBe('');
    expect(R.lines({})).toEqual([]);
    expect(R.placeOfSupplyStateCode({})).toBe('');
    expect(R.amount({})).toBe(0);
    expect(R.amount({ lines: null })).toBe(0);
  });

  it('bills each period the sum its lines add up to, tax included', () => {
    const row = { clientName: 'Acme', lines: LINES, placeOfSupplyStateCode: '27' };

    expect(R.clientName(row)).toBe('Acme');
    expect(R.lines(row)).toBe(LINES);
    expect(R.placeOfSupplyStateCode(row)).toBe('27');
    expect(R.amount(row)).toBe(59_000);
  });
});

describe('createRecurringInvoice', () => {
  it('names the client and seeds the first run from the start date', async () => {
    const clientId = await seedClient();

    const created = await M.createRecurringInvoice(null, { input: input(clientId) }, asFinance);

    expect(created).toMatchObject({ name: 'Acme retainer', clientName: 'Priya' });
    const stored = await RecurringInvoiceModel.findById(created.id).lean();
    expect(stored?.nextRunAt).toEqual(START);
    expect(stored?.placeOfSupplyStateCode).toBe('');
    expect(stored?.generatedCount).toBe(0);
  });

  it('refuses a schedule with nothing on it', async () => {
    const clientId = await seedClient();

    await expect(
      M.createRecurringInvoice(null, { input: input(clientId, { lines: [] }) }, asFinance),
    ).rejects.toThrow(/Add at least one line/);
    await expect(
      M.createRecurringInvoice(null, { input: input(clientId, { lines: null }) }, asFinance),
    ).rejects.toThrow(/Add at least one line/);
    expect(await RecurringInvoiceModel.countDocuments()).toBe(0);
  });

  it('refuses a client that does not exist', async () => {
    await expect(
      M.createRecurringInvoice(null, { input: input('64b7f9c2f1a2b3c4d5e6f7a8') }, asFinance),
    ).rejects.toThrow(/client does not exist/);
  });
});

describe('updateRecurringInvoice', () => {
  it('changes what the retainer bills without moving where the schedule is up to', async () => {
    const clientId = await seedClient();
    const created = await M.createRecurringInvoice(null, { input: input(clientId) }, asFinance);
    await RecurringInvoiceModel.updateOne(
      { _id: created.id },
      { nextRunAt: new Date('2026-05-01T00:00:00.000Z') },
    );

    const updated = await M.updateRecurringInvoice(
      null,
      {
        id: created.id,
        input: input(clientId, { name: 'Acme support', placeOfSupplyStateCode: '27' }),
      },
      asFinance,
    );

    expect(updated).toMatchObject({ name: 'Acme support', placeOfSupplyStateCode: '27' });
    const stored = await RecurringInvoiceModel.findById(created.id).lean();
    expect(stored?.nextRunAt).toEqual(new Date('2026-05-01T00:00:00.000Z'));
  });

  it('refuses to empty a schedule of its lines', async () => {
    const clientId = await seedClient();
    const created = await M.createRecurringInvoice(null, { input: input(clientId) }, asFinance);

    await expect(
      M.updateRecurringInvoice(
        null,
        { id: created.id, input: input(clientId, { lines: [] }) },
        asFinance,
      ),
    ).rejects.toThrow(/Add at least one line/);
  });
});

describe('runRecurringInvoiceNow', () => {
  it('raises the current period as a draft and moves the schedule on', async () => {
    await updateBranding({ stateCode: '23' });
    const clientId = await seedClient();
    const created = await M.createRecurringInvoice(
      null,
      { input: input(clientId, { placeOfSupplyStateCode: '23' }) },
      asFinance,
    );

    const after = await M.runRecurringInvoiceNow(null, { id: created.id }, asFinance);

    expect(after.id).toBe(created.id);
    expect(after.generatedCount).toBe(1);
    expect(after.nextRunAt).toEqual(new Date('2026-04-01T00:00:00.000Z'));
    const invoice = await InvoiceModel.findOne().lean();
    expect(invoice).toMatchObject({
      status: 'DRAFT',
      clientName: 'Priya',
      amount: 59_000,
      currency: 'USD',
      issuedDate: START,
      dueDate: new Date('2026-03-16T00:00:00.000Z'),
      placeOfSupplyStateCode: '23',
      supplierStateCode: '23',
    });
  });

  it('refuses a schedule that does not exist', async () => {
    await expect(
      M.runRecurringInvoiceNow(null, { id: '64b7f9c2f1a2b3c4d5e6f7a8' }, asFinance),
    ).rejects.toThrow(/Recurring invoice not found/);
  });

  it('refuses a caller outside finance before touching the schedule', async () => {
    const clientId = await seedClient();
    const created = await M.createRecurringInvoice(null, { input: input(clientId) }, asFinance);

    await expect(M.runRecurringInvoiceNow(null, { id: created.id }, asHr)).rejects.toThrow(
      /do not have access/,
    );
    expect(await InvoiceModel.countDocuments()).toBe(0);
  });
});
