import { crmEntitiesResolvers } from '../../src/modules/crm';
import { LeadModel } from '../../src/modules/crm/crm.model';
import { CompanyModel } from '../../src/modules/crm/company.model';
import { ContactModel } from '../../src/modules/crm/contact.model';
import { DealModel } from '../../src/modules/crm/deal.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

const seedLead = () =>
  LeadModel.create({
    name: 'Ravi Kumar',
    email: 'Ravi@Acme.com',
    source: 'WEBSITE',
    stage: 'QUALIFIED',
    value: 50000,
    owner: 'Asha Rao',
    notes: 'Asked for a platform demo.',
  });

const input = { companyName: 'Acme Ltd', dealTitle: 'Acme platform rollout', value: 250000 };

const convert = (id: string, overrides: Partial<typeof input> = {}) =>
  crmEntitiesResolvers.Mutation.convertLead(
    null,
    { id, input: { ...input, ...overrides } },
    asSales,
  ) as Promise<{ id: string; companyId: string; contactId: string; stage: string }>;

describe('Converting a lead into a deal', () => {
  beforeAll(async () => {
    await CompanyModel.init();
  });

  it('creates the company, the contact and a deal at the top of the pipeline', async () => {
    const lead = await seedLead();

    const deal = await convert(lead._id.toHexString());

    const company = await CompanyModel.findById(deal.companyId).lean();
    expect(company).toMatchObject({ name: 'Acme Ltd', domain: 'acme.com', owner: 'Asha Rao' });
    const contact = await ContactModel.findById(deal.contactId).lean();
    expect(contact).toMatchObject({
      name: 'Ravi Kumar',
      email: 'ravi@acme.com',
      companyId: deal.companyId,
      companyName: 'Acme Ltd',
    });
    const saved = await DealModel.findById(deal.id).lean();
    expect(saved).toMatchObject({
      stage: 'QUALIFYING',
      value: 250000,
      owner: 'Asha Rao',
      notes: 'Asked for a platform demo.',
    });
  });

  it('marks the lead won and remembers the deal it became', async () => {
    const lead = await seedLead();

    const deal = await convert(lead._id.toHexString());

    const saved = await LeadModel.findById(lead._id).lean();
    expect(saved?.stage).toBe('WON');
    expect(saved?.convertedDealId).toBe(deal.id);
  });

  it('reuses an existing company whatever the case of its name', async () => {
    const existing = await CompanyModel.create({
      name: 'ACME LTD',
      domain: 'acme.io',
      owner: 'Someone Else',
    });
    const lead = await seedLead();

    const deal = await convert(lead._id.toHexString(), { companyName: 'acme ltd' });

    expect(deal.companyId).toBe(existing._id.toHexString());
    await expect(CompanyModel.countDocuments()).resolves.toBe(1);
  });

  it('reuses the company already filed under the lead email domain', async () => {
    const existing = await CompanyModel.create({
      name: 'Acme Corporation',
      domain: 'acme.com',
      owner: 'Someone Else',
    });
    const lead = await seedLead();

    const deal = await convert(lead._id.toHexString(), { companyName: 'Acme (new name)' });

    expect(deal.companyId).toBe(existing._id.toHexString());
    await expect(CompanyModel.countDocuments()).resolves.toBe(1);
  });

  it('does not file the same person twice at one company', async () => {
    const company = await CompanyModel.create({ name: 'Acme Ltd', domain: 'acme.com', owner: 'A' });
    const contact = await ContactModel.create({
      name: 'Ravi K.',
      email: 'ravi@acme.com',
      companyId: company._id.toHexString(),
      companyName: 'Acme Ltd',
      status: 'ACTIVE',
      owner: 'A',
    });
    const lead = await seedLead();

    const deal = await convert(lead._id.toHexString());

    expect(deal.contactId).toBe(contact._id.toHexString());
    await expect(ContactModel.countDocuments()).resolves.toBe(1);
  });

  it('refuses to convert a lead a second time', async () => {
    const lead = await seedLead();
    await convert(lead._id.toHexString());

    await expect(convert(lead._id.toHexString())).rejects.toThrow(/already been converted/);
    await expect(DealModel.countDocuments()).resolves.toBe(1);
  });

  it('weights the open pipeline by probability and leaves closed deals out', async () => {
    await DealModel.create([
      { title: 'A', stage: 'PROPOSAL', value: 1000, probability: 50, owner: 'x' },
      { title: 'B', stage: 'QUALIFYING', value: 400, probability: 25, owner: 'x' },
      { title: 'C', stage: 'WON', value: 9999, probability: 100, owner: 'x' },
    ]);

    const forecast = await crmEntitiesResolvers.Query.dealForecast(null, {}, asSales);

    expect(forecast).toEqual({ openCount: 2, openValue: 1400, weightedValue: 600 });
  });
});
