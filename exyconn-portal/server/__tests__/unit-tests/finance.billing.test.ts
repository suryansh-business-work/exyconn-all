import { financeBillingResolvers } from '../../src/modules/finance';
import { settleStatus, daysLate, bandFor } from '../../src/modules/finance/finance.billing';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { PaymentModel } from '../../src/modules/finance/payment.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asFinance: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};

interface PaymentArgs {
  invoiceId: string;
  amount: number;
  method?: string;
  reference?: string;
}

const pay = (input: PaymentArgs) =>
  financeBillingResolvers.Mutation.recordPayment(
    null,
    { input: { method: 'BANK_TRANSFER', ...input } },
    asFinance,
  );

const DAY = 86_400_000;

function seedInvoice(amount: number, overrides: Record<string, unknown> = {}) {
  return InvoiceModel.create({
    number: 'INV-001',
    clientId: 'client-1',
    amount,
    currency: 'INR',
    status: 'SENT',
    issuedDate: new Date(Date.now() - 10 * DAY),
    dueDate: new Date(Date.now() + 10 * DAY),
    ...overrides,
  });
}

describe('settleStatus', () => {
  it('marks an invoice paid once the money is all in', () => {
    expect(settleStatus('SENT', 1000, 1000)).toBe('PAID');
    // Slightly over (a rounding overshoot upstream) still settles it.
    expect(settleStatus('PARTIALLY_PAID', 1000, 1000.0)).toBe('PAID');
  });

  it('marks a part payment as such, instead of leaving it looking unpaid', () => {
    expect(settleStatus('SENT', 1000, 400)).toBe('PARTIALLY_PAID');
  });

  it('does not un-draft an invoice just because money arrived against it', () => {
    // Whether the invoice has gone out is a person's decision, not the ledger's.
    expect(settleStatus('DRAFT', 1000, 0)).toBe('DRAFT');
  });

  it('returns a fully refunded invoice to unpaid, not to paid', () => {
    expect(settleStatus('PAID', 1000, 0)).toBe('SENT');
  });
});

describe('receivables ageing', () => {
  it('counts an invoice due in the future as not late', () => {
    const now = new Date('2026-09-04T00:00:00.000Z');
    expect(daysLate(new Date('2026-09-20T00:00:00.000Z'), now)).toBeLessThanOrEqual(0);
    expect(bandFor(daysLate(new Date('2026-09-20T00:00:00.000Z'), now))).toBe('CURRENT');
  });

  it('puts each lateness in the band a finance team expects', () => {
    expect(bandFor(0)).toBe('CURRENT');
    expect(bandFor(1)).toBe('D1_30');
    expect(bandFor(30)).toBe('D1_30');
    expect(bandFor(31)).toBe('D31_60');
    expect(bandFor(60)).toBe('D31_60');
    expect(bandFor(61)).toBe('D60_PLUS');
    expect(bandFor(400)).toBe('D60_PLUS');
  });
});

describe('recordPayment', () => {
  it('writes the receipt and moves the invoice with it', async () => {
    const invoice = await seedInvoice(1000);

    await pay({ invoiceId: String(invoice._id), amount: 400, reference: 'NEFT-77' });

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.amountPaid).toBe(400);
    expect(after?.status).toBe('PARTIALLY_PAID');

    const [receipt] = await PaymentModel.find({ invoiceId: String(invoice._id) }).lean();
    expect(receipt).toMatchObject({
      amount: 400,
      invoiceNumber: 'INV-001',
      reference: 'NEFT-77',
      recordedBy: 'ap@exyconn.com',
    });
  });

  it('settles the invoice when the last instalment lands', async () => {
    const invoice = await seedInvoice(1000);

    await pay({ invoiceId: String(invoice._id), amount: 600 });
    await pay({ invoiceId: String(invoice._id), amount: 400 });

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.amountPaid).toBe(1000);
    expect(after?.status).toBe('PAID');
  });

  it('does not leave a rounding crumb owing after instalments', async () => {
    // 0.1 + 0.2 !== 0.3: without rounding, this invoice never reads as paid.
    const invoice = await seedInvoice(0.3);

    await pay({ invoiceId: String(invoice._id), amount: 0.1 });
    await pay({ invoiceId: String(invoice._id), amount: 0.2 });

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.amountPaid).toBe(0.3);
    expect(after?.status).toBe('PAID');
  });

  it('refuses to take more than is owed', async () => {
    const invoice = await seedInvoice(1000);
    await pay({ invoiceId: String(invoice._id), amount: 900 });

    await expect(pay({ invoiceId: String(invoice._id), amount: 200 })).rejects.toThrow(
      /Only 100 is outstanding/i,
    );

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.amountPaid).toBe(900);
  });

  it('takes a refund back off the invoice', async () => {
    const invoice = await seedInvoice(1000);
    await pay({ invoiceId: String(invoice._id), amount: 1000 });

    await pay({ invoiceId: String(invoice._id), amount: -250 });

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.amountPaid).toBe(750);
    expect(after?.status).toBe('PARTIALLY_PAID');
  });

  it('refuses to refund more than was ever paid', async () => {
    const invoice = await seedInvoice(1000);
    await pay({ invoiceId: String(invoice._id), amount: 100 });

    await expect(pay({ invoiceId: String(invoice._id), amount: -200 })).rejects.toThrow(
      /refund more than was ever paid/i,
    );
  });

  it('rejects a payment of nothing', async () => {
    const invoice = await seedInvoice(1000);
    await expect(pay({ invoiceId: String(invoice._id), amount: 0 })).rejects.toThrow(
      /records nothing/i,
    );
  });

  it('refuses a payment against an invoice that does not exist', async () => {
    await expect(pay({ invoiceId: '64b7f9c2f1a2b3c4d5e6f7a8', amount: 100 })).rejects.toThrow(
      /Invoice/i,
    );
  });
});

describe('receivables', () => {
  const report = () => financeBillingResolvers.Query.receivables(null, {}, asFinance);

  it('reports nothing owed when there are no open invoices', async () => {
    await expect(report()).resolves.toMatchObject({ outstanding: 0, overdue: 0, invoices: 0 });
  });

  it('counts only the unpaid balance, not the whole invoice', async () => {
    const invoice = await seedInvoice(1000);
    await pay({ invoiceId: String(invoice._id), amount: 400 });

    await expect(report()).resolves.toMatchObject({ outstanding: 600, invoices: 1 });
  });

  it('leaves drafts and settled invoices out of what is owed', async () => {
    await seedInvoice(500, { number: 'INV-DRAFT', status: 'DRAFT' });
    const paid = await seedInvoice(700, { number: 'INV-PAID' });
    await pay({ invoiceId: String(paid._id), amount: 700 });

    await expect(report()).resolves.toMatchObject({ outstanding: 0, invoices: 0 });
  });

  it('ages what is late into its band and keeps the rest current', async () => {
    await seedInvoice(1000, { number: 'INV-LATE', dueDate: new Date(Date.now() - 45 * DAY) });
    await seedInvoice(250, { number: 'INV-SOON', dueDate: new Date(Date.now() + 5 * DAY) });

    const result = await report();
    const band = (name: string) => result.buckets.find((b) => b.band === name);

    expect(result).toMatchObject({ outstanding: 1250, overdue: 1000, invoices: 2 });
    expect(band('D31_60')).toMatchObject({ invoices: 1, amount: 1000 });
    expect(band('CURRENT')).toMatchObject({ invoices: 1, amount: 250 });
    expect(band('D60_PLUS')).toMatchObject({ invoices: 0, amount: 0 });
  });
});
