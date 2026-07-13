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
// Clients is managed under Admin in the consolidated role model.
export const clientsResolvers = createCrudResolvers(clientsService, {
  name: 'Client',
  roles: [ROLES.ADMIN],
});
export { clientsTypeDefs };
