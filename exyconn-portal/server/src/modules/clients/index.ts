import { ClientModel } from './clients.model';
import { clientsTypeDefs } from './clients.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { assertPermission } from '../../lib/permissions';
import { ROLES } from '../../constants/roles';
import type { GraphQLContext } from '../../middleware/auth';
import { normalizeClient, type ClientInput } from './client.validation';
import { taxIdLabel } from './client-tax-id';
import { clientProjectOptions, setClientProjects } from './client-projects';

const crudService = createCrudService<ClientInput>(ClientModel as never, 'Client');

/** The generic CRUD, with every write normalised and checked (client.validation.ts). */
export const clientsService = {
  ...crudService,
  create: (input: ClientInput) => crudService.create(normalizeClient(input)),
  update: (id: string, input: Partial<ClientInput>) =>
    crudService.update(id, normalizeClient(input as ClientInput)),
};

/** Who works with clients: Admin keeps them; Finance and Projects pick them. */
const CLIENT_ROLES = [ROLES.ADMIN, ROLES.FINANCE, ROLES.PROJECTS];

// Clients is managed under Admin in the consolidated role model. Finance and Projects read
// the list to pick a client for an invoice or a project; the permission matrix can narrow
// either of them to VIEW only.
const crud = createCrudResolvers(clientsService, {
  name: 'Client',
  roles: CLIENT_ROLES,
  table: {
    searchFields: ['name', 'email', 'phone', 'company', 'taxId', 'city'],
    filterFields: ['name', 'email', 'phone', 'company', 'status', 'country'],
    sortFields: ['name', 'email', 'phone', 'company', 'status', 'country', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status', 'country'] },
});

type LeanClient = Record<string, string | null | undefined>;
const text = (field: string) => (client: LeanClient) => client[field] ?? '';

export const clientsResolvers = {
  /** Written before these fields existed, a `.lean()` row comes back without them. */
  Client: {
    country: text('country'),
    currency: text('currency'),
    taxIdType: (client: LeanClient) => client.taxIdType || null,
    taxId: text('taxId'),
    taxIdLabel: (client: LeanClient) => taxIdLabel(client.taxIdType),
    gstin: text('gstin'),
    stateCode: text('stateCode'),
    region: text('region'),
    city: text('city'),
    postalCode: text('postalCode'),
    billingAddress: text('billingAddress'),
  },
  Query: {
    ...crud.Query,
    clientProjectOptions: async (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
      await assertPermission(ctx, 'Client', CLIENT_ROLES, 'VIEW');
      return clientProjectOptions();
    },
  },
  Mutation: {
    ...crud.Mutation,
    setClientProjects: async (
      _p: unknown,
      { clientId, projectIds }: { clientId: string; projectIds: string[] },
      ctx: GraphQLContext,
    ) => {
      await assertPermission(ctx, 'Client', CLIENT_ROLES, 'EDIT');
      await assertPermission(ctx, 'Project', [ROLES.ADMIN, ROLES.PROJECTS], 'EDIT');
      return setClientProjects(clientId, projectIds);
    },
  },
};
export { clientsTypeDefs };
export { clientNameFor } from './client-name';
export { taxIdLabel } from './client-tax-id';
export { migrateClientTaxIds } from './client.migrate';
