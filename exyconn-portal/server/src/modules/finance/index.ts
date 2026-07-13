import { InvoiceModel } from './finance.model';
import { financeTypeDefs } from './finance.typeDefs';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';

interface InvoiceInput {
  number: string;
  clientId: string;
  amount: number;
  currency: string;
  status: string;
  issuedDate: Date;
  dueDate: Date;
}

export const financeService = createCrudService<InvoiceInput>(InvoiceModel as never, 'Invoice');
export const financeResolvers = createCrudResolvers(financeService, {
  name: 'Invoice',
  roles: [ROLES.FINANCE],
});
export { financeTypeDefs };
