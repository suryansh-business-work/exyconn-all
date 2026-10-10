import { financeBillingResolvers } from '../../../../src/modules/finance';
import { applyPayment } from '../../../../src/modules/finance/finance.billing';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { PaymentModel } from '../../../../src/modules/finance/payment.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';

useTestOrganization();

const as = (id: string, role: Role): GraphQLContext => ({
  user: { id, roles: [role], email: `${id}@exyconn.com` },
});
const asFinance = as('fin-1', ROLES.FINANCE);
const asHr = as('hr-1', ROLES.HR);

const Q = financeBillingResolvers.Query;
const DAY = 86_400_000;

const seedInvoice = (number: string, extra: Record<string, unknown> = {}) =>
  InvoiceModel.create({
    number,
    clientId: 'client-1',
    clientName: 'Acme',
    amount: 1000,
    currency: 'USD',
    status: 'SENT',
    issuedDate: new Date(Date.now() - 5 * DAY),
    dueDate: new Date(Date.now() + 5 * DAY),
    ...extra,
  });

const pay = (invoiceId: string, amount: number, extra: Record<string, unknown> = {}) =>
  financeBillingResolvers.Mutation.recordPayment(
    null,
    { input: { invoiceId, amount, method: 'UPI', ...extra } },
    asFinance,
  );

describe('Invoice money field resolvers', () => {
  it('reads a missing paid figure as nothing paid', () => {
    expect(financeBillingResolvers.Invoice.amountPaid({})).toBe(0);
    expect(financeBillingResolvers.Invoice.amountPaid({ amountPaid: null })).toBe(0);
    expect(financeBillingResolvers.Invoice.balanceDue({ amount: 500 })).toBe(500);
  });

  it('works the balance out from what was paid, to the cent', () => {
    expect(financeBillingResolvers.Invoice.amountPaid({ amountPaid: 120.5 })).toBe(120.5);
    expect(financeBillingResolvers.Invoice.balanceDue({ amount: 0.3, amountPaid: 0.1 })).toBe(0.2);
  });
});

describe('the payments ledger queries', () => {
  it('lists every receipt newest first, and the receipts of one invoice', async () => {
    const first = await seedInvoice('INV-001');
    const second = await seedInvoice('INV-002');
    await pay(first._id.toHexString(), 100, { receivedAt: new Date('2026-09-01T00:00:00.000Z') });
    await pay(second._id.toHexString(), 200, { receivedAt: new Date('2026-09-05T00:00:00.000Z') });
    await pay(first._id.toHexString(), 300, { receivedAt: new Date('2026-09-10T00:00:00.000Z') });

    const all = await Q.listPayments(null, {}, asFinance);
    const ofFirst = await Q.invoicePayments(
      null,
      { invoiceId: first._id.toHexString() },
      asFinance,
    );

    expect(all.map((row) => row.amount)).toEqual([300, 200, 100]);
    expect(all[0].id).toEqual(expect.any(String));
    expect(ofFirst.map((row) => row.amount)).toEqual([300, 100]);
  });

  it('pages the ledger through the grid query', async () => {
    const invoice = await seedInvoice('INV-001');
    await pay(invoice._id.toHexString(), 100, { reference: 'NEFT-1' });
    await pay(invoice._id.toHexString(), 200, { reference: 'NEFT-2' });

    const page = await Q.listPaymentsPaged(
      null,
      { input: { page: 0, pageSize: 1, search: 'NEFT-2' } },
      asFinance,
    );

    expect(page.totalCount).toBe(1);
    expect(page.rows).toHaveLength(1);
    expect(page.rows[0]).toMatchObject({ reference: 'NEFT-2', amount: 200 });
  });

  it('counts receipts by method and sums what came in', async () => {
    const invoice = await seedInvoice('INV-001');
    await pay(invoice._id.toHexString(), 100.1, { method: 'CARD' });
    await pay(invoice._id.toHexString(), 200.2, { method: 'CARD' });
    await pay(invoice._id.toHexString(), 50, { method: 'CASH' });

    const stats = await Q.listPaymentsStats(null, {}, asFinance);

    expect(stats.total).toBe(3);
    expect(stats.counts[0].field).toBe('method');
    expect(stats.counts[0].buckets).toEqual(
      expect.arrayContaining([
        { value: 'CARD', count: 2 },
        { value: 'CASH', count: 1 },
      ]),
    );
    expect(stats.sums).toEqual([{ field: 'amount', total: 350.3 }]);
  });

  it('reports an empty ledger as zero, not as missing', async () => {
    const stats = await Q.listPaymentsStats(null, {}, asFinance);

    expect(stats).toEqual({
      total: 0,
      counts: [{ field: 'method', buckets: [] }],
      sums: [{ field: 'amount', total: 0 }],
    });
  });

  it('is closed to anybody outside finance', async () => {
    await expect(Q.listPayments(null, {}, asHr)).rejects.toThrow(/do not have access/);
    await expect(Q.listPaymentsStats(null, {}, asHr)).rejects.toThrow(/do not have access/);
    await expect(Q.invoicePayments(null, { invoiceId: 'x' }, asHr)).rejects.toThrow(
      /do not have access/,
    );
    await expect(
      Q.listPaymentsPaged(null, { input: { page: 0, pageSize: 10 } }, asHr),
    ).rejects.toThrow(/do not have access/);
    await expect(Q.receivables(null, {}, asHr)).rejects.toThrow(/do not have access/);
  });
});

describe('applyPayment for a gateway', () => {
  const gateway = { id: 'gateway', name: 'Stripe', email: 'stripe@payments.test' };

  it('files the receipt and its audit rows under the actor it is given', async () => {
    const invoice = await seedInvoice('INV-001');

    await applyPayment(
      { invoiceId: invoice._id.toHexString(), amount: 1000, method: 'CARD' },
      { user: null },
      gateway,
    );

    const receipt = await PaymentModel.findOne().lean();
    expect(receipt).toMatchObject({ recordedBy: 'stripe@payments.test', reference: '', notes: '' });
    expect(receipt?.receivedAt).toBeInstanceOf(Date);
    const rows = await AuditLogModel.find().sort({ _id: 1 }).lean();
    expect(rows.map((row) => [row.module, row.actorEmail])).toEqual([
      ['Payment', 'stripe@payments.test'],
      ['Invoice', 'stripe@payments.test'],
    ]);
    expect((await InvoiceModel.findById(invoice._id).lean())?.status).toBe('PAID');
  });

  it('records nobody when neither an actor nor a signed-in user is known', async () => {
    const invoice = await seedInvoice('INV-001');

    await applyPayment(
      { invoiceId: invoice._id.toHexString(), amount: 10, method: 'CASH' },
      { user: null },
    );

    expect((await PaymentModel.findOne().lean())?.recordedBy).toBe('');
  });

  it('treats an invoice from before the ledger as having nothing paid', async () => {
    const invoice = await seedInvoice('INV-OLD');
    await InvoiceModel.collection.updateOne({ _id: invoice._id }, { $unset: { amountPaid: '' } });

    await pay(invoice._id.toHexString(), 250);

    expect(await InvoiceModel.findById(invoice._id).lean()).toMatchObject({
      amountPaid: 250,
      status: 'PARTIALLY_PAID',
    });
  });
});

describe('receivables', () => {
  it('skips an open invoice whose balance is already cleared', async () => {
    await seedInvoice('INV-CLEARED', { amountPaid: 1000 });
    await seedInvoice('INV-OWED', { amount: 400 });

    const report = await Q.receivables(null, {}, asFinance);

    expect(report).toMatchObject({ outstanding: 400, overdue: 0, invoices: 1 });
  });

  it('counts the whole amount of an old invoice that has no paid figure', async () => {
    const invoice = await seedInvoice('INV-OLD', { dueDate: new Date(Date.now() - 70 * DAY) });
    await InvoiceModel.collection.updateOne({ _id: invoice._id }, { $unset: { amountPaid: '' } });

    const report = await Q.receivables(null, {}, asFinance);

    expect(report).toMatchObject({ outstanding: 1000, overdue: 1000, invoices: 1 });
    expect(report.buckets.find((bucket) => bucket.band === 'D60_PLUS')).toEqual({
      band: 'D60_PLUS',
      label: '60+ days',
      invoices: 1,
      amount: 1000,
    });
  });
});
