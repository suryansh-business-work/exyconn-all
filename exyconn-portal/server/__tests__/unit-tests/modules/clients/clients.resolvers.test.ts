import type { DocumentNode, EnumTypeDefinitionNode } from 'graphql';
import { clientsResolvers, clientsTypeDefs } from '../../../../src/modules/clients';
import { TAX_ID_CODES } from '../../../../src/modules/clients/client-tax-id';
import { CLIENT_STATUSES, ClientModel } from '../../../../src/modules/clients/clients.model';
import { ProjectModel } from '../../../../src/modules/projects/projects.model';
import { ROLES, type Role } from '../../../../src/constants/roles';
import type { GraphQLContext } from '../../../../src/middleware/auth';

const signedInAs = (...roles: Role[]): GraphQLContext => ({
  user: { id: 'user-1', roles, email: 'someone@exyconn.test' },
});

interface SavedClient {
  id: string;
  country: string;
  taxIdType: string;
  taxId: string;
  gstin: string;
  stateCode: string;
}

type CrudResolver = (p: unknown, a: never, c: GraphQLContext) => Promise<unknown>;
/** The generated CRUD mutations, whose names the spread map does not carry in its type. */
const crud = clientsResolvers.Mutation as unknown as Record<string, CrudResolver>;

const input = {
  name: 'Acme',
  email: 'ops@acme.test',
  phone: '123',
  company: 'Acme Ltd',
  status: 'ACTIVE',
};

const enumValues = (doc: DocumentNode, name: string): string[] => {
  const node = doc.definitions.find(
    (definition): definition is EnumTypeDefinitionNode =>
      definition.kind === 'EnumTypeDefinition' && definition.name.value === name,
  );
  return (node?.values ?? []).map((value) => value.name.value);
};

describe('Client field resolvers', () => {
  const { Client } = clientsResolvers;

  it('reads blanks for a row written before the fields existed', () => {
    const legacy = {};

    expect(Client.country(legacy)).toBe('');
    expect(Client.currency(legacy)).toBe('');
    expect(Client.taxId(legacy)).toBe('');
    expect(Client.gstin(legacy)).toBe('');
    expect(Client.stateCode(legacy)).toBe('');
    expect(Client.region(legacy)).toBe('');
    expect(Client.city(legacy)).toBe('');
    expect(Client.postalCode(legacy)).toBe('');
    expect(Client.billingAddress(legacy)).toBe('');
    expect(Client.taxIdType(legacy)).toBeNull();
    expect(Client.taxIdType({ taxIdType: '' })).toBeNull();
    expect(Client.taxIdLabel(legacy)).toBe('');
  });

  it('passes stored values through and names the tax number', () => {
    const row = { country: 'IN', city: 'Pune', taxIdType: 'IN_GST', taxId: '27AAPFU0939F1ZV' };

    expect(Client.country(row)).toBe('IN');
    expect(Client.city(row)).toBe('Pune');
    expect(Client.taxIdType(row)).toBe('IN_GST');
    expect(Client.taxIdLabel(row)).toBe('GSTIN');
  });
});

describe('client writes', () => {
  it('normalises a client on create and on update', async () => {
    const created = (await crud.createClient(
      null,
      { input: { ...input, country: 'in', gstin: '27aapfu0939f1zv', stateCode: '27' } } as never,
      signedInAs(ROLES.ADMIN),
    )) as SavedClient;

    expect(created).toMatchObject({
      country: 'IN',
      taxIdType: 'IN_GST',
      taxId: '27AAPFU0939F1ZV',
      gstin: '27AAPFU0939F1ZV',
      stateCode: '27',
    });

    const updated = (await crud.updateClient(
      null,
      {
        id: created.id,
        input: { ...input, country: 'de', taxIdType: 'EU_VAT', taxId: 'de 123 456 789' },
      } as never,
      signedInAs(ROLES.ADMIN),
    )) as SavedClient;

    expect(updated).toMatchObject({
      country: 'DE',
      taxIdType: 'EU_VAT',
      taxId: 'DE123456789',
      gstin: '',
      stateCode: '',
    });
  });

  it('refuses an invalid client before anything is stored', async () => {
    await expect(
      crud.createClient(
        null,
        { input: { ...input, currency: 'rupee' } } as never,
        signedInAs(ROLES.ADMIN),
      ),
    ).rejects.toThrow('Choose a currency from the list.');
    await expect(ClientModel.countDocuments()).resolves.toBe(0);
  });
});

describe('clientProjectOptions', () => {
  it('lists projects for Finance', async () => {
    await ProjectModel.create({ name: 'Billing', status: 'ACTIVE' });

    const options = (await clientsResolvers.Query.clientProjectOptions(
      null,
      {},
      signedInAs(ROLES.FINANCE),
    )) as Array<{ name: string }>;

    expect(options.map((option) => option.name)).toEqual(['Billing']);
  });

  it('refuses a role that does not work with clients, and nobody signed in', async () => {
    await expect(
      clientsResolvers.Query.clientProjectOptions(null, {}, signedInAs(ROLES.WEBSITE)),
    ).rejects.toThrow('You do not have access to this resource');
    await expect(
      clientsResolvers.Query.clientProjectOptions(null, {}, { user: null }),
    ).rejects.toThrow('Authentication required');
  });
});

describe('setClientProjects', () => {
  it('lets Projects link projects to a client', async () => {
    const client = await ClientModel.create({ ...input, name: 'Priya' });
    const project = await ProjectModel.create({ name: 'Billing', status: 'ACTIVE' });

    await expect(
      clientsResolvers.Mutation.setClientProjects(
        null,
        { clientId: client._id.toHexString(), projectIds: [project.id] },
        signedInAs(ROLES.PROJECTS),
      ),
    ).resolves.toBe(true);

    const linked = await ProjectModel.findById(project._id).lean();
    expect(linked).toMatchObject({ clientId: client._id.toHexString(), clientName: 'Priya' });
  });

  it('refuses Finance, who may pick clients but not edit projects', async () => {
    const client = await ClientModel.create({ ...input, name: 'Priya' });

    await expect(
      clientsResolvers.Mutation.setClientProjects(
        null,
        { clientId: client._id.toHexString(), projectIds: [] },
        signedInAs(ROLES.FINANCE),
      ),
    ).rejects.toThrow('You do not have access to this resource');
  });
});

describe('clientsTypeDefs', () => {
  it('offers exactly the tax number kinds the server stores', () => {
    expect(enumValues(clientsTypeDefs, 'ClientTaxIdType')).toEqual(TAX_ID_CODES);
  });

  it('offers the client statuses the model accepts', () => {
    expect(enumValues(clientsTypeDefs, 'ClientStatus')).toEqual([...CLIENT_STATUSES]);
  });
});
