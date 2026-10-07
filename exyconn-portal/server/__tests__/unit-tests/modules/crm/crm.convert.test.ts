import { Types } from 'mongoose';
import { convertLead } from '../../../../src/modules/crm/crm.convert';
import { LeadModel } from '../../../../src/modules/crm/crm.model';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { DealModel } from '../../../../src/modules/crm/deal.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import type { ConvertLeadInput } from '../../../../src/modules/crm/crm.convert';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};

const seedLead = () =>
  LeadModel.create({
    name: 'Ravi Kumar',
    email: 'ravi@globex.io',
    stage: 'QUALIFIED',
    value: 10000,
    owner: 'Asha',
  });

const baseInput: ConvertLeadInput = {
  companyName: '  Globex  ',
  dealTitle: 'Globex pilot',
  value: 40000,
};

const convert = (id: string, over: Partial<ConvertLeadInput> = {}, ctx = asSales) =>
  convertLead(null, { id, input: { ...baseInput, ...over } }, ctx) as Promise<{
    id: string;
    companyId: string;
    contactId: string;
    contactName: string;
    expectedCloseDate: Date | null;
  }>;

describe('converting a lead — the inputs it honours', () => {
  beforeAll(async () => {
    await CompanyModel.init();
  });

  it('files the person the seller names instead of the lead itself', async () => {
    const lead = await seedLead();

    const deal = await convert(String(lead._id), {
      contactName: '  Priya Shah ',
      contactEmail: ' Priya@Globex.io ',
    });

    const contact = await ContactModel.findById(deal.contactId).lean();
    expect(contact).toMatchObject({ name: 'Priya Shah', email: 'priya@globex.io' });
    expect(deal.contactName).toBe('Priya Shah');
  });

  it('falls back to the lead when the named person is blank', async () => {
    const lead = await seedLead();

    const deal = await convert(String(lead._id), { contactName: '   ', contactEmail: null });

    const contact = await ContactModel.findById(deal.contactId).lean();
    expect(contact).toMatchObject({ name: 'Ravi Kumar', email: 'ravi@globex.io' });
  });

  it('trims the company name and keys the new account by the lead domain', async () => {
    const lead = await seedLead();

    const deal = await convert(String(lead._id));

    const company = await CompanyModel.findById(deal.companyId).lean();
    expect(company).toMatchObject({ name: 'Globex', domain: 'globex.io', owner: 'Asha' });
  });

  it('keeps the expected close date it was given, and none when it was not', async () => {
    const closeOn = new Date('2027-01-31T00:00:00.000Z');
    const first = await seedLead();
    const second = await seedLead();

    const dated = await convert(String(first._id), { expectedCloseDate: closeOn });
    const undated = await convert(String(second._id));

    expect(dated.expectedCloseDate).toEqual(closeOn);
    expect(undated.expectedCloseDate).toBeNull();
    await expect(DealModel.countDocuments()).resolves.toBe(2);
    // Both leads wrote from one domain, so the second reused the first one's account.
    await expect(CompanyModel.countDocuments()).resolves.toBe(1);
  });

  it('reports a lead that does not exist', async () => {
    await expect(convert(new Types.ObjectId().toHexString())).rejects.toThrow('Lead not found');
  });

  it('is refused to somebody outside the CRM role and changes nothing', async () => {
    const lead = await seedLead();

    await expect(convert(String(lead._id), {}, asEmployee)).rejects.toThrow();

    const saved = await LeadModel.findById(lead._id).lean();
    expect(saved?.convertedDealId).toBeNull();
    await expect(DealModel.countDocuments()).resolves.toBe(0);
  });
});
