import '../../../../src/modules/finance/finance.reminders';
import { RECEIVABLES_SOURCE } from '../../../../src/modules/finance/finance.dunning';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { reminderSources } from '../../../../src/modules/reminders';
import { ROLES } from '../../../../src/constants/roles';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'INR', locale: 'en-IN' });

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

const source = () => {
  const found = reminderSources().find((candidate) => candidate.key === RECEIVABLES_SOURCE);
  if (!found) {
    throw new Error('The overdue-invoice reminder source is not registered');
  }
  return found;
};

const seedInvoice = (number: string, status: string, extra: Record<string, unknown> = {}) =>
  InvoiceModel.create({
    number,
    clientId: 'client-1',
    clientName: 'Nimbus Ltd',
    amount: 1000,
    amountPaid: 0,
    currency: 'INR',
    status,
    issuedDate: new Date(NOW.getTime() - 40 * DAY),
    dueDate: new Date(NOW.getTime() - 5 * DAY),
    ...extra,
  });

describe('the overdue-invoice reminder source', () => {
  it('is registered under the receivables key with its label', () => {
    expect(source().label).toBe('Overdue invoices');
  });

  it('has nothing to say when no invoice is overdue', async () => {
    await seedInvoice('INV-SENT', 'SENT');

    await expect(source().due(NOW)).resolves.toEqual([]);
  });

  it('itemises each overdue invoice for the finance team, keyed by the invoice alone', async () => {
    const invoice = await seedInvoice('INV-007', 'OVERDUE', { amountPaid: 400 });

    const [reminder] = await source().due(NOW);

    expect(reminder).toMatchObject({
      dedupeKey: `invoice-overdue:${invoice._id.toHexString()}`,
      kind: 'FINANCE',
      title: 'Invoice INV-007 is overdue',
      link: '/finance',
      roles: [ROLES.FINANCE],
    });
    expect(reminder.body).toContain('600');
    expect(reminder.body).toContain('from Nimbus Ltd was due 5 days ago');
  });

  it('names the client generically and owes the whole amount on an old, sparse row', async () => {
    const invoice = await seedInvoice('INV-OLD', 'OVERDUE', { clientName: '' });
    await InvoiceModel.collection.updateOne({ _id: invoice._id }, { $unset: { amountPaid: '' } });

    const [reminder] = await source().due(NOW);

    expect(reminder.body).toContain('1,000');
    expect(reminder.body).toContain('from the client was due');
  });
});
