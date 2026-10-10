import { emailInvoice, renderInvoice } from '../../../../src/modules/finance/invoice.send';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { AuditLogModel } from '../../../../src/modules/audit';
import { updateBranding } from '../../../../src/modules/branding/branding.service';
import { emailer } from '../../../../src/modules/email';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'USD', locale: 'en-US', taxSystem: 'NONE' });

jest.mock('../../../../src/modules/email', () => ({
  emailer: { send: jest.fn().mockResolvedValue(undefined) },
}));

const send = jest.mocked(emailer.send);

const seedInvoice = (extra: Record<string, unknown> = {}) =>
  InvoiceModel.create({
    number: 'INV-042',
    clientId: 'legacy-client',
    clientName: 'Priya',
    amount: 1200,
    amountPaid: 200,
    currency: 'USD',
    status: 'DRAFT',
    issuedDate: new Date('2026-09-01T00:00:00.000Z'),
    dueDate: new Date('2026-09-30T00:00:00.000Z'),
    ...extra,
  });

const seedClient = () =>
  ClientModel.create({
    name: 'Rahul Client',
    email: 'rahul@acme.test',
    company: 'Acme',
    status: 'ACTIVE',
    billingAddress: '4 Marine Drive',
  });

describe('renderInvoice', () => {
  it('refuses an invoice that does not exist', async () => {
    await expect(renderInvoice('64b7f9c2f1a2b3c4d5e6f7a8')).rejects.toThrow(/Invoice not found/);
  });

  it('prints under the stored name when the client id is not a client record', async () => {
    const invoice = await seedInvoice();

    const { filename, pdf, data } = await renderInvoice(invoice._id.toHexString());

    expect(filename).toBe('Invoice-INV-042.pdf');
    expect(pdf.subarray(0, 4).toString('latin1')).toBe('%PDF');
    expect(data.client).toEqual({
      name: 'Priya',
      company: '',
      email: '',
      taxId: '',
      taxIdLabel: '',
      billingAddress: '',
    });
    expect(data).toMatchObject({ locale: 'en-US', indianTaxRules: false });
  });

  it('falls back to the client id when neither a stored name nor a client is left', async () => {
    const invoice = await seedInvoice({ clientName: '' });

    const { data } = await renderInvoice(invoice._id.toHexString());

    expect(data.client.name).toBe('legacy-client');
  });

  it("reads the client's company, email and address, and its name when none was stored", async () => {
    const client = await seedClient();
    const invoice = await seedInvoice({ clientId: client._id.toHexString(), clientName: '' });

    const { data } = await renderInvoice(invoice._id.toHexString());

    expect(data.client).toMatchObject({
      name: 'Rahul Client',
      company: 'Acme',
      email: 'rahul@acme.test',
      billingAddress: '4 Marine Drive',
    });
  });

  it('prints the company block from Branding, preferring the one-line address', async () => {
    await updateBranding({
      businessName: 'Exyconn',
      address: 'Old address',
      addressLine: '12 MG Road, Indore',
      bankDetails: 'HDFC 1234',
    });
    const invoice = await seedInvoice();

    const { data } = await renderInvoice(invoice._id.toHexString());

    expect(data.company).toMatchObject({
      name: 'Exyconn',
      address: '12 MG Road, Indore',
      bankDetails: 'HDFC 1234',
    });
  });

  it('uses the long address when no one-line address is set', async () => {
    await updateBranding({ address: '12 MG Road, Indore', addressLine: '' });
    const invoice = await seedInvoice();

    expect((await renderInvoice(invoice._id.toHexString())).data.company.address).toBe(
      '12 MG Road, Indore',
    );
  });

  it('fills the fields an invoice from before payments and GST comes back without', async () => {
    const invoice = await seedInvoice();
    await InvoiceModel.collection.updateOne(
      { _id: invoice._id },
      { $unset: { amountPaid: '', lines: '', placeOfSupplyStateCode: '', supplierStateCode: '' } },
    );

    const { data } = await renderInvoice(invoice._id.toHexString());

    expect(data.invoice).toMatchObject({
      lines: [],
      amountPaid: 0,
      placeOfSupplyStateCode: '',
      supplierStateCode: '',
    });
  });
});

describe('emailInvoice', () => {
  it('files the send under the actor it is given, with the default note', async () => {
    const invoice = await seedInvoice();
    const contact = { id: 'contact-1', name: 'Priya', email: 'priya@acme.test' };

    await emailInvoice(invoice._id.toHexString(), 'priya@acme.test', null, { user: null }, contact);

    const [mail] = send.mock.calls[0];
    expect(mail.triggeredBy).toBe('priya@acme.test');
    expect(mail.variables).toMatchObject({
      message: 'Please find invoice INV-042 attached.',
      dueDate: '2026-09-30',
    });
    expect(mail.variables.total).toContain('1,200');
    expect(mail.variables.balanceDue).toContain('1,000');
    const [row] = await AuditLogModel.find().lean();
    expect(row).toMatchObject({
      actorEmail: 'priya@acme.test',
      summary: 'Sent Invoice INV-042 to priya@acme.test',
    });
  });

  it('records no sender when nobody is signed in and no actor is given', async () => {
    const invoice = await seedInvoice({ status: 'SENT' });

    const saved = await emailInvoice(invoice._id.toHexString(), 'priya@acme.test', undefined, {
      user: null,
    });

    expect(send.mock.calls[0][0].triggeredBy).toBe('');
    expect(saved).toMatchObject({ id: invoice._id.toHexString(), status: 'SENT' });
  });

  it('reports the invoice missing when it is deleted while the email goes out', async () => {
    const invoice = await seedInvoice();
    send.mockImplementationOnce(async () => {
      await InvoiceModel.deleteOne({ _id: invoice._id });
    });

    await expect(
      emailInvoice(invoice._id.toHexString(), 'priya@acme.test', 'Hi', { user: null }),
    ).rejects.toThrow(/Invoice not found/);
    expect(await AuditLogModel.countDocuments()).toBe(0);
  });
});
