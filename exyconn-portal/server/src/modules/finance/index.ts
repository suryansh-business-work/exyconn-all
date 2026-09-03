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

/**
 * `amountPaid` is deliberately absent from the input: it is the payments ledger's to write,
 * never a form's. See finance.billing.ts.
 */

export const financeService = createCrudService<InvoiceInput>(InvoiceModel as never, 'Invoice');
export const financeResolvers = createCrudResolvers(financeService, {
  name: 'Invoice',
  roles: [ROLES.FINANCE],
  table: {
    searchFields: ['number', 'clientId', 'currency'],
    filterFields: ['number', 'clientId', 'currency', 'status'],
    sortFields: ['number', 'clientId', 'amount', 'status', 'issuedDate', 'dueDate', 'createdAt'],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'], sum: ['amount'] },
});
export { financeTypeDefs };
export { financeBillingTypeDefs } from './finance.billing.typeDefs';
export { financeBillingResolvers } from './finance.billing';
export { financeCompanyTypeDefs } from './finance.company.typeDefs';
export { financeCompanyResolvers, companyExpensesService } from './finance.company';
