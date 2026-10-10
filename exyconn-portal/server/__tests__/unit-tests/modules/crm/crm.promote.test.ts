import { Types } from 'mongoose';
import {
  clientForDeal,
  ensureClient,
  promoteCompanyToClient,
} from '../../../../src/modules/crm/crm.promote';
import { CompanyModel } from '../../../../src/modules/crm/company.model';
import { ContactModel } from '../../../../src/modules/crm/contact.model';
import { ClientModel } from '../../../../src/modules/clients/clients.model';
import { ROLES } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';
import { asArg } from '../../../mockAs';

const asSales: GraphQLContext = {
  user: { id: 'user-1', roles: [ROLES.CRM], email: 'sales@exyconn.com' },
};
const asEmployee: GraphQLContext = {
  user: { id: 'user-2', roles: [ROLES.EMPLOYEE], email: 'dev@exyconn.com' },
};
const missingId = () => new Types.ObjectId().toHexString();

const seedCompany = (over: Record<string, unknown> = {}) =>
  CompanyModel.create({ name: 'Initech', domain: 'initech.com', owner: 'Asha', ...over });

const seedContact = (companyId: string, over: Record<string, unknown> = {}) =>
  ContactModel.create({
    name: 'Peter',
    email: 'peter@initech.com',
    phone: '+1 555 0100',
    companyId,
    status: 'ACTIVE',
    owner: 'Asha',
    ...over,
  });

const leanCompany = async (id: unknown) => {
  const row = await CompanyModel.findById(id).lean();
  if (!row) throw new Error('company was not seeded');
  return row;
};

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ensureClient', () => {
  it('addresses the client to the first active person when the named one is gone', async () => {
    const company = await seedCompany();
    await seedContact(company._id.toHexString(), {
      email: 'left@initech.com',
      status: 'LEFT_COMPANY',
    });
    await seedContact(company._id.toHexString());

    const clientId = await ensureClient(await leanCompany(company._id), missingId());

    const client = await ClientModel.findById(clientId).lean();
    expect(client?.email).toBe('peter@initech.com');
  });

  it("takes the contact's phone when the account has none on file", async () => {
    const company = await seedCompany();
    await seedContact(company._id.toHexString());

    const clientId = await ensureClient(await leanCompany(company._id));

    const client = await ClientModel.findById(clientId).lean();
    expect(client?.phone).toBe('+1 555 0100');
  });

  it('files the client with no phone when nobody has one', async () => {
    const company = await seedCompany();

    const clientId = await ensureClient(await leanCompany(company._id));

    const client = await ClientModel.findById(clientId).lean();
    expect(client).toMatchObject({ email: 'unknown@initech.com', phone: '' });
    const account = await leanCompany(company._id);
    expect(account.clientId).toBe(clientId);
  });

  it('returns the client already on the account without filing another', async () => {
    const company = await seedCompany({ clientId: 'client-7' });

    await expect(ensureClient(await leanCompany(company._id))).resolves.toBe('client-7');
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
  });
});

describe('clientForDeal', () => {
  it('reports an account that no longer exists', async () => {
    await expect(clientForDeal({ companyId: missingId(), title: 'Ghost deal' })).rejects.toThrow(
      'Company not found',
    );
  });

  it('refuses a deal whose company was never set', async () => {
    await expect(clientForDeal({ companyId: null, title: 'Loose deal' })).rejects.toThrow(
      'Deal "Loose deal" has no company',
    );
  });
});

describe('promoteCompanyToClient', () => {
  it('reports a company that does not exist', async () => {
    await expect(promoteCompanyToClient(null, { id: missingId() }, asSales)).rejects.toThrow(
      'Company not found',
    );
  });

  it('is refused to somebody outside the CRM role', async () => {
    const company = await seedCompany();

    await expect(
      promoteCompanyToClient(null, { id: company._id.toHexString() }, asEmployee),
    ).rejects.toThrow();
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
  });

  it('reports a company deleted while it was being promoted', async () => {
    const company = await seedCompany();
    const realFindById = CompanyModel.findById.bind(CompanyModel);
    jest
      .spyOn(CompanyModel, 'findById')
      .mockImplementationOnce(realFindById as never)
      .mockReturnValueOnce(asArg({ lean: () => Promise.resolve(null) }));

    await expect(
      promoteCompanyToClient(null, { id: company._id.toHexString() }, asSales),
    ).rejects.toThrow('Company not found');
    await expect(ClientModel.countDocuments()).resolves.toBe(1);
  });
});
