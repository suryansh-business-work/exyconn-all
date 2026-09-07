import { ClientModel } from './clients.model';
import { clientsTypeDefs } from './clients.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface ClientInput {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
}

export const clientsService = createCrudService<ClientInput>(ClientModel as never, 'Client');
// Clients is managed under Admin in the consolidated role model. Finance and Projects read
// the list to pick a client for an invoice or a project; the permission matrix can narrow
// either of them to VIEW only.
export const clientsResolvers = createCrudResolvers(clientsService, {
  name: 'Client',
  roles: [ROLES.ADMIN, ROLES.FINANCE, ROLES.PROJECTS],
  table: {
    searchFields: ['name', 'email', 'phone', 'company'],
    filterFields: ['name', 'email', 'phone', 'company', 'status'],
    sortFields: ['name', 'email', 'phone', 'company', 'status', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'] },
});
export { clientsTypeDefs };
export { clientNameFor } from './client-name';
