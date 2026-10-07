import { Types } from 'mongoose';
import { clientHubService, ownInvoice } from '../../../../src/modules/clienthub/clienthub.service';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { PaymentModel } from '../../../../src/modules/finance/payment.model';
import { emailInvoice, renderInvoice } from '../../../../src/modules/finance/invoice.send';
import type { ClientHubContact } from '../../../../src/modules/clienthub/clienthub.auth';
import { useTestOrganization } from '../../../helpers';

jest.mock('../../../../src/modules/finance/invoice.send', () => ({
  ...jest.requireActual('../../../../src/modules/finance/invoice.send'),
  renderInvoice: jest.fn(),
  emailInvoice: jest.fn(),
}));

const organizationId = useTestOrganization();
const PAGE = { page: 0, pageSize: 10 };
const ISSUED = new Date('2026-08-01T00:00:00.000Z');

let contact: ClientHubContact;

beforeEach(async () => {
  const client = await ClientModel.create({
    name: 'Dana',
    email: 'dana@acme.test',
    company: 'Acme',
  });
  contact = {
    id: 'contact-1',
    clientId: String(client._id),
    name: 'Dana Reyes',
    email: 'dana@acme.test',
    organizationId,
  };
});

const invoice = (fields: Record<string, unknown>) =>
  InvoiceModel.create({
    number: 'INV-1',
    clientId: contact.clientId,
    amount: 100,
    currency: 'USD',
    status: 'SENT',
    issuedDate: ISSUED,
    dueDate: new Date('2026-09-01T00:00:00.000Z'),
    ...fields,
  });

describe('me', () => {
  it('names the contact and their client', async () => {
    expect(await clientHubService.me(contact)).toEqual({
      name: 'Dana Reyes',
      email: 'dana@acme.test',
      clientName: 'Dana',
      company: 'Acme',
    });
  });

  it('leaves the client fields blank once the client is gone', async () => {
    await ClientModel.deleteMany({});

    expect(await clientHubService.me(contact)).toMatchObject({ clientName: '', company: '' });
  });
});

describe('invoices', () => {
  it('lists the client’s sent invoices, never drafts or another client’s', async () => {
    await invoice({ number: 'INV-1' });
    await invoice({ number: 'INV-2', status: 'DRAFT' });
    await invoice({ number: 'INV-3', clientId: 'someone-else' });

    const page = await clientHubService.invoices(contact, PAGE);

    expect(page.totalCount).toBe(1);
    expect(page.rows[0]).toMatchObject({ number: 'INV-1', id: expect.any(String) });
  });
});

describe('ownInvoice', () => {
  it('finds the client’s own sent invoice', async () => {
    const sent = await invoice({});

    expect((await ownInvoice(contact, String(sent._id))).number).toBe('INV-1');
  });

  it.each([
    ['a draft', { status: 'DRAFT' }],
    ['another client’s', { clientId: 'someone-else' }],
  ])('treats %s invoice as not found', async (_label, fields) => {
    const hidden = await invoice(fields);

    await expect(ownInvoice(contact, String(hidden._id))).rejects.toThrow(/Invoice not found/);
  });
});

describe('invoicePdf and emailInvoice', () => {
  it('returns the rendered PDF as base64', async () => {
    const sent = await invoice({});
    jest.mocked(renderInvoice).mockResolvedValue({ pdf: Buffer.from('%PDF') } as never);

    expect(await clientHubService.invoicePdf(contact, String(sent._id))).toBe(
      Buffer.from('%PDF').toString('base64'),
    );
  });

  it('emails the invoice to the contact’s own address under a client actor', async () => {
    const sent = await invoice({});

    expect(await clientHubService.emailInvoice(contact, String(sent._id), 'test-ip')).toBe(true);

    expect(emailInvoice).toHaveBeenCalledWith(
      String(sent._id),
      'dana@acme.test',
      null,
      { user: null, ip: 'test-ip' },
      { id: 'client:contact-1', name: 'Dana Reyes', email: 'dana@acme.test' },
    );
  });

  it('renders and emails nothing for an invoice that is not the contact’s', async () => {
    const hidden = await invoice({ clientId: 'someone-else' });
    const id = String(hidden._id);

    await expect(clientHubService.invoicePdf(contact, id)).rejects.toThrow(/not found/);
    await expect(clientHubService.emailInvoice(contact, id, '')).rejects.toThrow(/not found/);
    expect(renderInvoice).not.toHaveBeenCalled();
    expect(emailInvoice).not.toHaveBeenCalled();
  });
});

describe('payments', () => {
  it('lists only the client’s own receipts', async () => {
    const base = { invoiceId: 'i1', invoiceNumber: 'INV-1', amount: 50, currency: 'USD' };
    await PaymentModel.create({ ...base, clientId: contact.clientId, receivedAt: ISSUED });
    await PaymentModel.create({ ...base, clientId: 'someone-else', receivedAt: ISSUED });

    const page = await clientHubService.payments(contact, PAGE);

    expect(page.totalCount).toBe(1);
    expect(page.rows[0]).toMatchObject({ amount: 50, id: expect.any(String) });
  });
});

describe('reminders', () => {
  const NOW = new Date('2026-09-11T00:00:00.000Z');

  it('lists what is still owed, soonest due first, with how late each one is', async () => {
    await invoice({ number: 'LATE', amountPaid: 40, dueDate: new Date('2026-09-01') });
    await invoice({ number: 'SOON', status: 'OVERDUE', dueDate: new Date('2026-08-21') });
    await invoice({ number: 'FUTURE', dueDate: new Date('2026-10-01') });
    await invoice({ number: 'SETTLED', status: 'PARTIALLY_PAID', amountPaid: 100 });
    await invoice({ number: 'DRAFT', status: 'DRAFT' });
    await invoice({ number: 'PAID', status: 'PAID', amountPaid: 100 });

    const rows = await clientHubService.reminders(contact, NOW);

    expect(rows.map((row) => [row.number, row.balance, row.daysLate])).toEqual([
      ['SOON', 100, 21],
      ['LATE', 60, 10],
      ['FUTURE', 100, 0],
    ]);
  });

  it('reads an invoice written without a paid figure as nothing paid', async () => {
    await InvoiceModel.collection.insertOne({
      number: 'OLD',
      clientId: contact.clientId,
      amount: 75.5,
      currency: 'USD',
      status: 'SENT',
      issuedDate: ISSUED,
      dueDate: new Date('2026-09-10'),
      organizationId: new Types.ObjectId(organizationId),
    });

    const [row] = await clientHubService.reminders(contact, NOW);

    expect(row).toMatchObject({ number: 'OLD', balance: 75.5, daysLate: 1, currency: 'USD' });
  });

  it('defaults to the current time', async () => {
    await invoice({ dueDate: new Date(Date.now() + 86_400_000 * 3) });

    const [row] = await clientHubService.reminders(contact);

    expect(row.daysLate).toBe(0);
  });
});
