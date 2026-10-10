import { createInvoiceFromDeal } from '../../../../src/modules/finance/invoice.from-deal';
import { InvoiceModel } from '../../../../src/modules/finance/finance.model';
import { DealModel } from '../../../../src/modules/crm/deal.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { updateBranding } from '../../../../src/modules/branding/branding.service';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { useTestOrganization } from '../../../helpers';

useTestOrganization({ currency: 'EUR', locale: 'de-DE' });

const asSales: GraphQLContext = {
  user: { id: 'crm-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

const seedDeal = (clientId: string, extra: Record<string, unknown> = {}) =>
  DealModel.create({
    title: 'Rollout',
    companyName: 'Acme GmbH',
    stage: 'WON',
    value: 999.99,
    probability: 100,
    owner: 'Asha',
    clientId,
    ...extra,
  });

const fromDeal = (dealId: string) =>
  createInvoiceFromDeal(null, { dealId }, asSales) as Promise<{ id: string; number: string }>;

describe('createInvoiceFromDeal', () => {
  it('refuses a deal that does not exist', async () => {
    await expect(fromDeal('64b7f9c2f1a2b3c4d5e6f7a8')).rejects.toThrow(/Deal not found/);
  });

  it('refuses a won deal whose client has since been deleted', async () => {
    const deal = await seedDeal('64b7f9c2f1a2b3c4d5e6f7a8');

    await expect(fromDeal(deal._id.toHexString())).rejects.toThrow(/Client not found/);
    expect(await InvoiceModel.countDocuments()).toBe(0);
  });

  it('bills in the company currency, rounds the taxed total, and copes with no state code', async () => {
    await updateBranding({ defaultTaxPercent: 19, stateCode: '' });
    const client = await ClientModel.create({
      name: 'Acme GmbH',
      email: 'billing@acme.de',
      company: 'Acme GmbH',
      status: 'ACTIVE',
    });
    await ClientModel.collection.updateOne({ _id: client._id }, { $unset: { stateCode: '' } });
    const deal = await seedDeal(client._id.toHexString());

    const invoice = await fromDeal(deal._id.toHexString());

    const stored = await InvoiceModel.findById(invoice.id).lean();
    expect(stored).toMatchObject({
      currency: 'EUR',
      // 999.99 × 1.19 = 1189.9881, to the cent.
      amount: 1189.99,
      placeOfSupplyStateCode: '',
      supplierStateCode: '',
    });
    expect(stored?.lines[0]).toMatchObject({ rate: 999.99, taxPercent: 19 });
  });

  it('refuses a caller who is neither sales nor finance', async () => {
    const asHr: GraphQLContext = {
      user: { id: 'hr-1', roles: [ROLES.HR], email: 'hr@exyconn.com' },
    };

    await expect(createInvoiceFromDeal(null, { dealId: 'x' }, asHr)).rejects.toThrow(
      /do not have access/,
    );
  });
});
