import {
  remindDueSoonInvoices,
  DUE_SOON_DAYS,
} from '../../../../src/modules/finance/finance.dueSoon';
import { invoicePayUrl } from '../../../../src/modules/finance/invoice.payLink';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { emailer } from '../../../../src/modules/email';
import { logger } from '../../../../src/utils/logger';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'INR', locale: 'en-IN' });

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const send = jest.mocked(emailer.send);

const DAY = 86_400_000;
const NOW = new Date('2026-09-20T09:00:00.000Z');

async function seedClient(email = 'accounts@nimbus.test') {
  const client = await ClientModel.create({
    name: 'Nimbus Ltd',
    email,
    company: 'Nimbus Ltd',
    status: 'ACTIVE',
  });
  return String(client._id);
}

interface Fields {
  clientId: string;
  number?: string;
  /** Days from NOW until the due date. */
  dueInDays?: number;
  status?: string;
  amountPaid?: number;
  clientName?: string;
}

const seedInvoice = (fields: Fields) =>
  InvoiceModel.create({
    number: fields.number ?? 'INV-001',
    clientId: fields.clientId,
    clientName: fields.clientName ?? 'Nimbus Ltd',
    amount: 1000,
    amountPaid: fields.amountPaid ?? 0,
    currency: 'INR',
    status: fields.status ?? 'SENT',
    issuedDate: new Date(NOW.getTime() - 20 * DAY),
    dueDate: new Date(NOW.getTime() + (fields.dueInDays ?? 2) * DAY),
  });

afterEach(() => jest.restoreAllMocks());

describe('remindDueSoonInvoices', () => {
  it('reminds the client once, with the balance and a link to pay', async () => {
    const clientId = await seedClient();
    const invoice = await seedInvoice({ clientId, amountPaid: 250, clientName: '' });

    await expect(remindDueSoonInvoices(NOW)).resolves.toBe(1);
    await expect(remindDueSoonInvoices(NOW)).resolves.toBe(0);

    expect(send).toHaveBeenCalledTimes(1);
    const [mail] = send.mock.calls[0];
    expect(mail).toMatchObject({
      template: 'invoice-due-soon',
      to: 'accounts@nimbus.test',
      triggeredBy: 'Invoice due-soon reminder',
      variables: {
        clientName: 'there',
        invoiceNumber: 'INV-001',
        dueDate: invoice.dueDate.toISOString().slice(0, 10),
        payUrl: invoicePayUrl(String(invoice._id)),
      },
    });
    expect(mail.variables.balanceDue).toContain('750');
    const [row] = await AuditLogModel.find({ module: 'Invoice' }).lean();
    expect(row).toMatchObject({
      action: 'UPDATE',
      entityId: String(invoice._id),
      summary: 'Sent the due-soon reminder for Invoice INV-001 to accounts@nimbus.test',
    });
  });

  it('sends nothing when no invoice falls due in the window', async () => {
    const clientId = await seedClient();
    await seedInvoice({ clientId, number: 'INV-LATER', dueInDays: DUE_SOON_DAYS + 1 });
    await seedInvoice({ clientId, number: 'INV-PAST', dueInDays: -1 });

    await expect(remindDueSoonInvoices(NOW)).resolves.toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it('leaves out drafts, overdue invoices, settled balances and clients with no address', async () => {
    const clientId = await seedClient();
    await seedInvoice({ clientId, number: 'INV-DRAFT', status: 'DRAFT' });
    await seedInvoice({ clientId, number: 'INV-OVERDUE', status: 'OVERDUE' });
    await seedInvoice({ clientId, number: 'INV-SETTLED', amountPaid: 1000 });
    await seedInvoice({ clientId: 'not-a-client', number: 'INV-NOBODY' });
    await seedInvoice({ clientId, number: 'INV-PART', status: 'PARTIALLY_PAID', amountPaid: 100 });

    await expect(remindDueSoonInvoices(NOW)).resolves.toBe(1);
    expect(send.mock.calls.map(([mail]) => mail.variables.invoiceNumber)).toEqual(['INV-PART']);
  });

  it('reads an invoice with no paid figure as owing all of it', async () => {
    const clientId = await seedClient();
    const invoice = await seedInvoice({ clientId });
    await InvoiceModel.collection.updateOne({ _id: invoice._id }, { $unset: { amountPaid: '' } });

    await expect(remindDueSoonInvoices(NOW)).resolves.toBe(1);
    expect(send.mock.calls[0][0].variables.balanceDue).toContain('1,000');
    expect(send.mock.calls[0][0].variables.clientName).toBe('Nimbus Ltd');
  });

  it('logs a failed send, does not count it, and never retries the same reminder', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const clientId = await seedClient();
    await seedInvoice({ clientId, number: 'INV-009' });
    send.mockRejectedValueOnce(new Error('SMTP is down'));

    await expect(remindDueSoonInvoices(NOW)).resolves.toBe(0);
    await expect(remindDueSoonInvoices(NOW)).resolves.toBe(0);

    expect(send).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(
      expect.any(Error),
      'Due-soon reminder for invoice INV-009 could not be sent',
    );
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });
});
