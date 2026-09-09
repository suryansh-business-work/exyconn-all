import { financeResolvers } from '../../src/modules/finance';
import { InvoiceModel } from '../../src/modules/finance/finance.model';
import { CounterModel } from '../../src/lib/counter.model';
import { nextInvoiceNumber } from '../../src/modules/finance/invoice.number';
import { DealModel } from '../../src/modules/crm/deal.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { updateBranding } from '../../src/modules/branding/branding.service';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

const DAY = 86_400_000;

async function seedWonDeal(overrides: Record<string, unknown> = {}) {
  const client = await ClientModel.create({
    name: 'Acme Ltd',
    email: 'billing@acme.com',
    phone: '000',
    company: 'Acme Ltd',
    status: 'ACTIVE',
    stateCode: '27',
  });
  const deal = await DealModel.create({
    title: 'Acme platform rollout',
    companyName: 'Acme Ltd',
    stage: 'WON',
    value: 100000,
    probability: 100,
    owner: 'Asha Rao',
    clientId: String(client._id),
    ...overrides,
  });
  return { client, deal };
}

const fromDeal = (dealId: string, ctx = asSales) =>
  financeResolvers.Mutation.createInvoiceFromDeal(null, { dealId }, ctx) as Promise<{
    id: string;
    number: string;
  }>;

describe('nextInvoiceNumber', () => {
  it('counts up under the prefix Branding sets, zero-padded', async () => {
    await updateBranding({ invoicePrefix: 'EXY/26-27/' });

    await expect(nextInvoiceNumber()).resolves.toBe('EXY/26-27/0001');
    await expect(nextInvoiceNumber()).resolves.toBe('EXY/26-27/0002');
  });

  it('starts at INV-0001 out of the box', async () => {
    await expect(nextInvoiceNumber()).resolves.toBe('INV-0001');
    await expect(CounterModel.countDocuments()).resolves.toBe(1);
  });
});

describe('createInvoiceFromDeal', () => {
  it('drafts one line for the deal value at the default tax, due in thirty days', async () => {
    await updateBranding({ defaultTaxPercent: 18, stateCode: '27' });
    const { client, deal } = await seedWonDeal();

    const invoice = await fromDeal(String(deal._id));

    const saved = await InvoiceModel.findById(invoice.id).lean();
    expect(saved).toMatchObject({
      number: 'INV-0001',
      clientId: String(client._id),
      clientName: 'Acme Ltd',
      dealId: String(deal._id),
      status: 'DRAFT',
      currency: 'INR',
      amount: 118000,
      placeOfSupplyStateCode: '27',
      supplierStateCode: '27',
    });
    expect(saved?.lines).toHaveLength(1);
    expect(saved?.lines[0]).toMatchObject({
      description: 'Acme platform rollout',
      quantity: 1,
      rate: 100000,
      taxPercent: 18,
    });
    const days = (saved!.dueDate.getTime() - saved!.issuedDate.getTime()) / DAY;
    expect(Math.round(days)).toBe(30);
  });

  it('splits the tax into its GST heads on the way back out', async () => {
    await updateBranding({ defaultTaxPercent: 18, stateCode: '27' });
    const { deal } = await seedWonDeal();
    const invoice = await fromDeal(String(deal._id));

    const row = await InvoiceModel.findById(invoice.id).lean();

    expect(financeResolvers.Invoice.subtotal(row!)).toBe(100000);
    expect(financeResolvers.Invoice.cgst(row!)).toBe(9000);
    expect(financeResolvers.Invoice.sgst(row!)).toBe(9000);
    expect(financeResolvers.Invoice.igst(row!)).toBe(0);
  });

  it('refuses to bill the same deal twice, naming the invoice that exists', async () => {
    const { deal } = await seedWonDeal();
    await fromDeal(String(deal._id));

    await expect(fromDeal(String(deal._id))).rejects.toThrow(/already billed on invoice INV-0001/);
    await expect(InvoiceModel.countDocuments()).resolves.toBe(1);
  });

  it('refuses a deal that is not won', async () => {
    const { deal } = await seedWonDeal({ stage: 'NEGOTIATION' });

    await expect(fromDeal(String(deal._id))).rejects.toThrow(/not been won/);
  });

  it('refuses a won deal that never became a client', async () => {
    const { deal } = await seedWonDeal({ clientId: '' });

    await expect(fromDeal(String(deal._id))).rejects.toThrow(/has no client/);
  });

  it('is open to finance as well as sales, and to nobody else', async () => {
    const { deal } = await seedWonDeal();
    const asFinance: GraphQLContext = {
      user: { id: 'user-2', roles: [ROLES.FINANCE], email: 'ap@exyconn.com' },
    };
    const asHr: GraphQLContext = {
      user: { id: 'user-3', roles: [ROLES.HR], email: 'hr@exyconn.com' },
    };

    await expect(fromDeal(String(deal._id), asHr)).rejects.toThrow();
    await expect(fromDeal(String(deal._id), asFinance)).resolves.toMatchObject({
      number: 'INV-0001',
    });
  });
});
