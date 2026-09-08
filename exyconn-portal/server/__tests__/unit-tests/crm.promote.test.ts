import { crmEntitiesResolvers } from '../../src/modules/crm';
import { CompanyModel } from '../../src/modules/crm/company.model';
import { ContactModel } from '../../src/modules/crm/contact.model';
import { DealModel } from '../../src/modules/crm/deal.model';
import { ClientModel } from '../../src/modules/clients/clients.model';
import { ROLES } from '../../src/constants/roles';
import type { GraphQLContext } from '../../src/middleware/auth';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};

const seedCompany = (overrides: Record<string, unknown> = {}) =>
  CompanyModel.create({
    name: 'Acme Ltd',
    domain: 'acme.com',
    phone: '+91 98765 43210',
    owner: 'Asha Rao',
    ...overrides,
  });

const seedContact = (companyId: string, overrides: Record<string, unknown> = {}) =>
  ContactModel.create({
    name: 'Ravi Kumar',
    email: 'ravi@acme.com',
    phone: '+91 11111 11111',
    companyId,
    companyName: 'Acme Ltd',
    status: 'ACTIVE',
    owner: 'Asha Rao',
    ...overrides,
  });

const seedDeal = (companyId: string, overrides: Record<string, unknown> = {}) =>
  DealModel.create({
    title: 'Acme platform rollout',
    companyId,
    companyName: 'Acme Ltd',
    stage: 'NEGOTIATION',
    value: 250000,
    probability: 80,
    owner: 'Asha Rao',
    ...overrides,
  });

const win = (id: string) =>
  crmEntitiesResolvers.Mutation.setDealStage(null, { id, stage: 'WON' }, asSales) as Promise<{
    id: string;
    clientId: string;
  }>;

describe('Winning a deal makes the account a client', () => {
  it('creates one client from the company and stamps it on both records', async () => {
    const company = await seedCompany();
    await seedContact(String(company._id));
    const deal = await seedDeal(String(company._id));

    const won = await win(String(deal._id));

    const client = await ClientModel.findById(won.clientId).lean();
    expect(client).toMatchObject({
      name: 'Acme Ltd',
      company: 'Acme Ltd',
      email: 'ravi@acme.com',
      phone: '+91 98765 43210',
      status: 'ACTIVE',
    });
    const account = await CompanyModel.findById(company._id).lean();
    expect(account?.clientId).toBe(won.clientId);
    await expect(ClientModel.countDocuments()).resolves.toBe(1);
  });

  it('prefers the email of the contact the deal names', async () => {
    const company = await seedCompany();
    await seedContact(String(company._id));
    const named = await seedContact(String(company._id), {
      name: 'Priya',
      email: 'priya@acme.com',
    });
    const deal = await seedDeal(String(company._id), { contactId: String(named._id) });

    const won = await win(String(deal._id));

    const client = await ClientModel.findById(won.clientId).lean();
    expect(client?.email).toBe('priya@acme.com');
  });

  it('reuses the client on a second win for the same account', async () => {
    const company = await seedCompany();
    await seedContact(String(company._id));
    const first = await seedDeal(String(company._id));
    const second = await seedDeal(String(company._id), { title: 'Acme phase two' });

    const firstWon = await win(String(first._id));
    const secondWon = await win(String(second._id));

    expect(secondWon.clientId).toBe(firstWon.clientId);
    await expect(ClientModel.countDocuments()).resolves.toBe(1);
  });

  it('falls back to the domain when nobody at the account has an email', async () => {
    const company = await seedCompany();
    const deal = await seedDeal(String(company._id));

    const won = await win(String(deal._id));

    const client = await ClientModel.findById(won.clientId).lean();
    expect(client?.email).toBe('unknown@acme.com');
  });

  it('refuses a win when there is neither a contact email nor a domain to reach', async () => {
    // Inserted through the raw collection: the schema requires a domain, so only a row
    // written before that rule can lack one — and that row must still not become a
    // client with nowhere to send the invoice.
    const { insertedId } = await CompanyModel.collection.insertOne({
      name: 'Nameless Ltd',
      owner: 'Asha Rao',
    });
    const deal = await seedDeal(String(insertedId));

    await expect(win(String(deal._id))).rejects.toThrow(/no contact with an email/);

    const saved = await DealModel.findById(deal._id).lean();
    expect(saved?.stage).toBe('NEGOTIATION');
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
  });

  it('refuses a win for a deal with no company', async () => {
    const deal = await seedDeal('');

    await expect(win(String(deal._id))).rejects.toThrow(/has no company/);
  });

  it('does the same hand-off when the form saves the deal as won', async () => {
    const company = await seedCompany();
    await seedContact(String(company._id));
    const deal = await seedDeal(String(company._id));

    const saved = (await crmEntitiesResolvers.Mutation.updateDeal(
      null,
      {
        id: String(deal._id),
        input: {
          title: deal.title,
          companyId: String(company._id),
          companyName: 'Acme Ltd',
          stage: 'WON',
          value: 300000,
          probability: 100,
          owner: 'Asha Rao',
        },
      } as never,
      asSales,
    )) as { id: string; clientId: string; value: number };

    expect(saved.value).toBe(300000);
    const account = await CompanyModel.findById(company._id).lean();
    expect(account?.clientId).toBe(saved.clientId);
    expect(saved.clientId).not.toBe('');
  });

  it('leaves a deal that is not won without a client', async () => {
    const company = await seedCompany();
    const deal = await seedDeal(String(company._id));

    const moved = (await crmEntitiesResolvers.Mutation.setDealStage(
      null,
      { id: String(deal._id), stage: 'PROPOSAL' },
      asSales,
    )) as { id: string; clientId: string; stage: string };

    expect(moved.stage).toBe('PROPOSAL');
    expect(moved.clientId).toBe('');
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
  });
});

describe('promoteCompanyToClient', () => {
  const promote = (id: string) =>
    crmEntitiesResolvers.Mutation.promoteCompanyToClient(null, { id }, asSales) as Promise<{
      id: string;
      clientId: string;
    }>;

  it('makes a client of the account by hand, and reports it as one', async () => {
    const company = await seedCompany();
    await seedContact(String(company._id));

    const promoted = await promote(String(company._id));

    expect(promoted.clientId).not.toBe('');
    expect(crmEntitiesResolvers.Company.isClient(promoted)).toBe(true);
    await expect(ClientModel.countDocuments()).resolves.toBe(1);
  });

  it('is a no-op the second time', async () => {
    const company = await seedCompany();
    await seedContact(String(company._id));

    const first = await promote(String(company._id));
    const second = await promote(String(company._id));

    expect(second.clientId).toBe(first.clientId);
    await expect(ClientModel.countDocuments()).resolves.toBe(1);
  });
});
