import { financeResolvers } from '../../src/modules/finance';
import {
  invoiceAmount,
  lineAmount,
  linesSubtotal,
  linesTax,
  linesTotal,
} from '../../src/modules/finance/invoice.lines';
import { buildInvoicePdf, invoiceFilename } from '../../src/modules/finance/invoice.pdf';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { emailer } from '../../src/modules/email';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

// The send goes through the template engine; there is no SMTP here.
jest.mock('../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const asFinance: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
};

const send = jest.mocked(emailer.send);

const LINES = [
  { description: 'Design', quantity: 2, rate: 1000, taxPercent: 18 },
  { description: 'Hosting', quantity: 1, rate: 500, taxPercent: 0 },
];

/** `%PDF` — the four bytes every PDF starts with. */
const PDF_MAGIC = '%PDF';

async function seedInvoice(overrides: Record<string, unknown> = {}) {
  const client = await ClientModel.create({
    name: 'Priya',
    email: 'priya@acme.test',
    phone: '000',
    company: 'Acme',
    status: 'ACTIVE',
  });
  return InvoiceModel.create({
    number: 'INV-007',
    clientId: String(client._id),
    clientName: 'Priya',
    lines: LINES,
    amount: 2860,
    currency: 'INR',
    status: 'DRAFT',
    issuedDate: new Date('2026-09-01T00:00:00.000Z'),
    dueDate: new Date('2026-09-30T00:00:00.000Z'),
    ...overrides,
  });
}

describe('invoice lines', () => {
  it('bills a line as quantity × rate, plus its tax', () => {
    expect(lineAmount({ description: 'x', quantity: 2, rate: 1000, taxPercent: 18 })).toBe(2360);
    expect(lineAmount({ description: 'x', quantity: 1, rate: 500, taxPercent: 0 })).toBe(500);
  });

  it('rounds each line to the cent, so a total never carries a floating crumb', () => {
    expect(lineAmount({ description: 'x', quantity: 3, rate: 0.1, taxPercent: 0 })).toBe(0.3);
  });

  it('splits the total into what was billed and what the tax added', () => {
    expect(linesSubtotal(LINES)).toBe(2500);
    expect(linesTax(LINES)).toBe(360);
    expect(linesTotal(LINES)).toBe(2860);
  });

  it('makes the amount the lines when there are any, and the typed figure when not', () => {
    expect(invoiceAmount({ lines: LINES, amount: 1 })).toBe(2860);
    expect(invoiceAmount({ lines: [], amount: 750 })).toBe(750);
    expect(invoiceAmount({ amount: 750 })).toBe(750);
    expect(invoiceAmount({ lines: [] })).toBeNull();
  });
});

describe('invoice pdf', () => {
  it('names the file after the invoice number, safely', () => {
    expect(invoiceFilename('INV-007')).toBe('Invoice-INV-007.pdf');
    expect(invoiceFilename('2026/09 #4')).toBe('Invoice-2026-09-4.pdf');
  });

  it('renders a real PDF document with a line table', async () => {
    const pdf = await buildInvoicePdf({
      company: { name: 'Exyconn', address: 'Indore', supportEmail: 'support@exyconn.com' },
      client: { name: 'Priya', company: 'Acme', email: 'priya@acme.test' },
      invoice: {
        number: 'INV-007',
        currency: 'INR',
        status: 'SENT',
        issuedDate: new Date('2026-09-01T00:00:00.000Z'),
        dueDate: new Date('2026-09-30T00:00:00.000Z'),
        lines: LINES,
        amount: 2860,
        amountPaid: 1000,
      },
    });

    expect(pdf.length).toBeGreaterThan(500);
    expect(pdf.subarray(0, 4).toString('latin1')).toBe(PDF_MAGIC);
  });

  it('serves the invoice as base64 that decodes to a PDF', async () => {
    const invoice = await seedInvoice();

    const base64 = (await financeResolvers.Query.invoicePdf(
      null,
      { id: String(invoice._id) } as never,
      asFinance,
    )) as string;

    expect(base64.length).toBeGreaterThan(0);
    expect(Buffer.from(base64, 'base64').subarray(0, 4).toString('latin1')).toBe(PDF_MAGIC);
  });

  it('refuses to render for a role that is not finance', async () => {
    const invoice = await seedInvoice();
    const asHr: GraphQLContext = {
      user: { id: 'user-2', roles: [ROLES.HR], email: 'hr@exyconn.com' },
    };

    await expect(
      financeResolvers.Query.invoicePdf(null, { id: String(invoice._id) } as never, asHr),
    ).rejects.toThrow();
  });
});

describe('sendInvoice', () => {
  beforeEach(() => send.mockClear());

  const sendTo = (id: string, email = 'priya@acme.test', message?: string) =>
    financeResolvers.Mutation.sendInvoice(null, { id, email, message } as never, asFinance);

  it('emails the PDF through the invoice template and stamps sentAt', async () => {
    const invoice = await seedInvoice();

    await sendTo(String(invoice._id), 'priya@acme.test', 'Thanks for your business.');

    expect(send).toHaveBeenCalledTimes(1);
    const [input] = send.mock.calls[0];
    expect(input).toMatchObject({
      template: 'invoice-sent',
      to: 'priya@acme.test',
      triggeredBy: 'ap@exyconn.com',
      variables: {
        clientName: 'Priya',
        invoiceNumber: 'INV-007',
        message: 'Thanks for your business.',
      },
    });
    expect(input.attachments?.[0].filename).toBe('Invoice-INV-007.pdf');
    expect(input.attachments?.[0].content.subarray(0, 4).toString('latin1')).toBe(PDF_MAGIC);

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.sentAt).toBeInstanceOf(Date);
  });

  it('moves a draft to SENT — the invoice has now gone out', async () => {
    const invoice = await seedInvoice({ status: 'DRAFT' });

    await sendTo(String(invoice._id));

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.status).toBe('SENT');
  });

  it('leaves the ledger-driven status of a part-paid invoice alone', async () => {
    const invoice = await seedInvoice({ status: 'PARTIALLY_PAID', amountPaid: 1000 });

    await sendTo(String(invoice._id));

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.status).toBe('PARTIALLY_PAID');
  });

  it('does not stamp sentAt when the mail could not be sent', async () => {
    const invoice = await seedInvoice();
    send.mockRejectedValueOnce(new Error('SMTP is down'));

    await expect(sendTo(String(invoice._id))).rejects.toThrow(/SMTP is down/);

    const after = await InvoiceModel.findById(invoice._id).lean();
    expect(after?.sentAt).toBeNull();
  });
});
