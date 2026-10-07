import { Types } from 'mongoose';
import {
  chaseOverdueInvoices,
  emailsByClient,
  RECEIVABLES_SOURCE,
} from '../../../../src/modules/finance/finance.dunning';
import { invoicePayUrl } from '../../../../src/modules/finance/invoice.payLink';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { ReminderLogModel } from '../../../../src/modules/reminders';
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

const seedOverdue = (
  clientId: string,
  number: string,
  dueDaysAgo: number,
  extra: Record<string, unknown> = {},
) =>
  InvoiceModel.create({
    number,
    clientId,
    clientName: 'Nimbus Ltd',
    amount: 1000,
    amountPaid: 0,
    currency: 'INR',
    status: 'OVERDUE',
    issuedDate: new Date(NOW.getTime() - (dueDaysAgo + 30) * DAY),
    dueDate: new Date(NOW.getTime() - dueDaysAgo * DAY),
    ...extra,
  });

afterEach(() => jest.restoreAllMocks());

describe('emailsByClient', () => {
  it('maps each real client to its address, once', async () => {
    const id = await seedClient();

    const addresses = await emailsByClient([id, id, 'not-an-id']);

    expect([...addresses]).toEqual([[id, 'accounts@nimbus.test']]);
  });

  it('asks nothing of the database when no id is a real one', async () => {
    const find = jest.spyOn(ClientModel, 'find');

    const addresses = await emailsByClient(['client-1', '']);

    expect(addresses.size).toBe(0);
    expect(find).not.toHaveBeenCalled();
  });

  it('leaves out a client whose address has been blanked', async () => {
    const id = await seedClient();
    await ClientModel.collection.updateOne(
      { _id: new Types.ObjectId(id) },
      { $set: { email: '' } },
    );

    expect((await emailsByClient([id])).size).toBe(0);
  });
});

describe('chaseOverdueInvoices', () => {
  it('sends the stage letter with the balance, the lateness and a pay link', async () => {
    const clientId = await seedClient();
    const invoice = await seedOverdue(clientId, 'INV-014', 15, {
      clientName: '',
      amountPaid: 400,
    });

    await expect(chaseOverdueInvoices(NOW)).resolves.toBe(1);

    const [letter] = send.mock.calls[0];
    expect(letter).toMatchObject({
      template: 'invoice-overdue',
      to: 'accounts@nimbus.test',
      triggeredBy: 'Overdue invoice sweep',
      variables: {
        clientName: 'there',
        invoiceNumber: 'INV-014',
        daysLate: '15',
        payUrl: invoicePayUrl(String(invoice._id)),
      },
    });
    expect(letter.variables.balanceDue).toContain('600');
    const claim = await ReminderLogModel.findOne().lean();
    expect(claim).toMatchObject({
      source: RECEIVABLES_SOURCE,
      dedupeKey: `invoice-dunning:${String(invoice._id)}:14`,
    });
  });

  it('chases nothing before the first stage, nor an invoice with nothing left owing', async () => {
    const clientId = await seedClient();
    await seedOverdue(clientId, 'INV-EARLY', 2);
    await seedOverdue(clientId, 'INV-SETTLED', 20, { amountPaid: 1000 });

    await expect(chaseOverdueInvoices(NOW)).resolves.toBe(0);
    expect(send).not.toHaveBeenCalled();
    expect(await ReminderLogModel.countDocuments()).toBe(0);
  });

  it('reads an invoice with no paid figure as owing all of it', async () => {
    const clientId = await seedClient();
    const invoice = await seedOverdue(clientId, 'INV-OLD', 31);
    await InvoiceModel.collection.updateOne({ _id: invoice._id }, { $unset: { amountPaid: '' } });
    await InvoiceModel.collection.updateOne({ _id: invoice._id }, { $unset: { clientName: '' } });

    await expect(chaseOverdueInvoices(NOW)).resolves.toBe(1);
    expect(send.mock.calls[0][0].variables).toMatchObject({ clientName: 'there', daysLate: '31' });
    expect(send.mock.calls[0][0].variables.balanceDue).toContain('1,000');
  });

  it('burns the stage on a failed send, logs it, and does not write it to the change log', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const clientId = await seedClient();
    await seedOverdue(clientId, 'INV-FAIL', 5);
    send.mockRejectedValueOnce(new Error('SMTP is down'));

    await expect(chaseOverdueInvoices(NOW)).resolves.toBe(0);
    await expect(chaseOverdueInvoices(NOW)).resolves.toBe(0);

    expect(send).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalledWith(
      expect.any(Error),
      'Overdue chase for invoice INV-FAIL could not be sent',
    );
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });

  it('keeps chasing the rest after one letter fails', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => undefined);
    const clientId = await seedClient();
    await seedOverdue(clientId, 'INV-A', 5);
    await seedOverdue(clientId, 'INV-B', 5);
    send.mockRejectedValueOnce(new Error('SMTP is down'));

    await expect(chaseOverdueInvoices(NOW)).resolves.toBe(1);
    expect(send).toHaveBeenCalledTimes(2);
  });
});
