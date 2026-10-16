import { crmEntitiesResolvers } from '../../../../src/modules/crm';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const LOGO = 'https://ik.imagekit.io/exyconn/crm-companies/acme.png';
const AVATAR = 'https://ik.imagekit.io/exyconn/crm-contacts/asha.png';

const companyInput = (logoUrl?: string) => ({
  name: 'Acme Ltd',
  domain: 'acme.com',
  size: '1-10',
  status: 'PROSPECT',
  owner: 'A',
  logoUrl,
});

const contactInput = (avatarUrl?: string) => ({
  name: 'Asha Rao',
  email: 'asha@acme.com',
  status: 'ACTIVE',
  owner: 'A',
  avatarUrl,
});

const createCompany = (input: Record<string, unknown>) =>
  crmEntitiesResolvers.Mutation.createCompany(null, { input } as never, asSales) as Promise<{
    id: string;
  }>;
const createContact = (input: Record<string, unknown>) =>
  crmEntitiesResolvers.Mutation.createContact(null, { input } as never, asSales) as Promise<{
    id: string;
  }>;

describe('company logo and contact picture', () => {
  it('saves and reads back a company logo', async () => {
    const created = await createCompany(companyInput(LOGO));

    const row = await CompanyModel.findById(created.id).lean();
    expect(crmEntitiesResolvers.Company.logoUrl(row as never)).toBe(LOGO);
  });

  it('saves and reads back a contact picture', async () => {
    const created = await createContact(contactInput(AVATAR));

    const row = await ContactModel.findById(created.id).lean();
    expect(crmEntitiesResolvers.Contact.avatarUrl(row as never)).toBe(AVATAR);
  });

  it('reads an empty picture on rows saved before the fields existed', async () => {
    const { insertedId: companyId } = await CompanyModel.collection.insertOne({
      name: 'Old Co',
      domain: 'old.co',
      owner: 'A',
    });
    const { insertedId: contactId } = await ContactModel.collection.insertOne({
      name: 'Old Contact',
      email: 'old@old.co',
      owner: 'A',
    });

    const company = await CompanyModel.findById(companyId).lean();
    const contact = await ContactModel.findById(contactId).lean();
    expect(company).not.toHaveProperty('logoUrl');
    expect(crmEntitiesResolvers.Company.logoUrl(company as never)).toBe('');
    expect(crmEntitiesResolvers.Contact.avatarUrl(contact as never)).toBe('');
  });

  it('refuses a picture that is not a web address', async () => {
    await expect(createCompany(companyInput('ftp://files.acme.com/logo.png'))).rejects.toThrow(
      'A picture must be a web address (http or https). Upload it again.',
    );
    await expect(createContact(contactInput('not a url'))).rejects.toThrow(
      'A picture must be a web address',
    );
    expect(await CompanyModel.countDocuments()).toBe(0);
    expect(await ContactModel.countDocuments()).toBe(0);
  });

  it('accepts a blank picture, which shows the initials', async () => {
    const created = await createCompany(companyInput(''));

    const row = await CompanyModel.findById(created.id).lean();
    expect(row?.logoUrl).toBe('');
  });
});
