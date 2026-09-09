import { RecurringInvoiceModel } from '../../src/modules/finance/recurring-invoice.model';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { generateDueInvoices } from '../../src/modules/finance/finance.recurring';

const at = (iso: string) => new Date(iso);

async function schedule(overrides: Record<string, unknown> = {}) {
  return RecurringInvoiceModel.create({
    name: 'Acme retainer',
    clientId: 'client-1',
    clientName: 'Acme Ltd',
    lines: [{ description: 'Support retainer', quantity: 1, rate: 50000, taxPercent: 18 }],
    currency: 'INR',
    frequency: 'MONTHLY',
    startDate: at('2026-03-01T00:00:00Z'),
    nextRunAt: at('2026-03-01T00:00:00Z'),
    dueDays: 30,
    active: true,
    ...overrides,
  });
}

describe('recurring invoices', () => {
  it('raises a draft invoice for a due retainer and moves the schedule on', async () => {
    const row = await schedule();

    const raised = await generateDueInvoices(at('2026-03-02T00:00:00Z'));

    expect(raised).toBe(1);
    const invoices = await InvoiceModel.find({ clientId: 'client-1' }).lean();
    expect(invoices).toHaveLength(1);
    // A machine may prepare an invoice; a person sends it.
    expect(invoices[0].status).toBe('DRAFT');
    // 50000 + 18% tax.
    expect(invoices[0].amount).toBe(59000);

    const after = await RecurringInvoiceModel.findById(row._id).lean();
    expect(after?.generatedCount).toBe(1);
    expect(after?.nextRunAt.toISOString()).toContain('2026-04-01');
  });

  it('bills the period it is on, not today, when a tick runs late', async () => {
    // A server that was off over the weekend must still date the invoice to the period.
    await schedule();

    await generateDueInvoices(at('2026-03-20T00:00:00Z'));

    const invoice = await InvoiceModel.findOne({ clientId: 'client-1' }).lean();
    expect(invoice?.issuedDate.toISOString()).toContain('2026-03-01');
    // Issue + 30 days of terms.
    expect(invoice?.dueDate.toISOString()).toContain('2026-03-31');
  });

  it('never bills the same period twice, however many times it runs', async () => {
    // The failure you find out about from the client.
    await schedule();

    await generateDueInvoices(at('2026-03-02T00:00:00Z'));
    await generateDueInvoices(at('2026-03-02T00:00:00Z'));
    await generateDueInvoices(at('2026-03-02T00:00:00Z'));

    expect(await InvoiceModel.countDocuments({ clientId: 'client-1' })).toBe(1);
  });

  it('catches up every period it is behind, rather than forgiving them', async () => {
    // A retainer three months behind means the business is owed three months. Quietly
    // skipping to "this month" is money nobody ever bills and nobody notices.
    await schedule();

    const raised = await generateDueInvoices(at('2026-05-02T00:00:00Z'));

    expect(raised).toBe(3);
    const issued = (
      await InvoiceModel.find({ clientId: 'client-1' }).sort({ issuedDate: 1 }).lean()
    ).map((invoice) => invoice.issuedDate.toISOString().slice(0, 7));
    expect(issued).toEqual(['2026-03', '2026-04', '2026-05']);
  });

  it('bounds a catch-up, so a start date mistyped as years ago cannot run away', async () => {
    await schedule({
      startDate: at('2019-01-01T00:00:00Z'),
      nextRunAt: at('2019-01-01T00:00:00Z'),
    });

    const raised = await generateDueInvoices(at('2026-05-02T00:00:00Z'));

    // Twelve periods, then it waits for the next tick — visible, never sixty at once.
    expect(raised).toBe(12);
  });

  it('leaves a paused retainer alone, and resumes on the period it was paused in', async () => {
    const row = await schedule({ active: false });

    expect(await generateDueInvoices(at('2026-04-02T00:00:00Z'))).toBe(0);

    await RecurringInvoiceModel.updateOne({ _id: row._id }, { active: true });
    await generateDueInvoices(at('2026-04-02T00:00:00Z'));

    const invoice = await InvoiceModel.findOne({ clientId: 'client-1' }).lean();
    // March, the period it was paused in — a pause forgives nothing.
    expect(invoice?.issuedDate.toISOString()).toContain('2026-03-01');
  });

  it('stops after the end date', async () => {
    await schedule({ endDate: at('2026-02-01T00:00:00Z') });

    expect(await generateDueInvoices(at('2026-03-02T00:00:00Z'))).toBe(0);
  });

  it('does nothing for a retainer whose moment has not arrived', async () => {
    await schedule({ nextRunAt: at('2026-06-01T00:00:00Z') });

    expect(await generateDueInvoices(at('2026-03-02T00:00:00Z'))).toBe(0);
  });

  it('gives each generated invoice its own number from the shared series', async () => {
    await schedule();
    await schedule({ name: 'Globex retainer', clientId: 'client-2', clientName: 'Globex' });

    await generateDueInvoices(at('2026-03-02T00:00:00Z'));

    const numbers = (await InvoiceModel.find().lean()).map((invoice) => invoice.number);
    expect(new Set(numbers).size).toBe(2);
  });
});
