import { LeadModel } from './crm.model';
import { crmTypeDefs } from './crm.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface LeadInput {
  name: string;
  email: string;
  source: string;
  stage: string;
  value: number;
  owner: string;
}

export const crmService = createCrudService<LeadInput>(LeadModel as never, 'Lead');
export const crmResolvers = createCrudResolvers(crmService, {
  name: 'Lead',
  roles: [ROLES.CRM],
});
export { crmTypeDefs };
