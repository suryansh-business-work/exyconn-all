import { InvoiceModel } from './finance.model';
import { financeTypeDefs } from './finance.typeDefs';
import { invoiceAmount, lineAmount, type InvoiceLineInput } from './invoice.lines';
import { invoicePdf, sendInvoice } from './invoice.send';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { badRequest } from '../../utils/errors';
import { clientNameFor } from '../clients';
import type { GraphQLContext } from '../../middleware/auth';

interface InvoiceInput {
  number: string;
  clientId: string;
  clientName?: string;
  lines?: InvoiceLineInput[] | null;
  amount?: number | null;
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
const crud = createCrudResolvers(financeService, {
  name: 'Invoice',
  roles: [ROLES.FINANCE],
  table: {
    searchFields: ['number', 'clientName', 'currency'],
    filterFields: ['number', 'clientName', 'currency', 'status'],
    sortFields: [
      'number',
      'clientName',
      'amount',
      'status',
      'issuedDate',
      'dueDate',
      'sentAt',
      'createdAt',
    ],
    defaultSort: { field: 'createdAt', dir: 'DESC' },
  },
  stats: { countBy: ['status'], sum: ['amount'] },
});

/**
 * What the form sends, made whole: the client's name looked up from its id and the amount
 * settled from the lines. Both are decided here rather than trusted from the client, so an
 * invoice can never carry a name or a total that its own rows disagree with.
 */
async function completeInput(input: InvoiceInput): Promise<InvoiceInput> {
  const amount = invoiceAmount(input);
  if (amount === null) {
    badRequest('Enter an amount, or add at least one line.');
  }
  return {
    ...input,
    lines: input.lines ?? [],
    amount,
    clientName: await clientNameFor(input.clientId),
  };
}

const createInvoice = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { input } = args as unknown as { input: InvoiceInput };
  const completed = { input: await completeInput(input) } as unknown as never;
  return crud.Mutation.createInvoice(p, completed, ctx);
};

const updateInvoice = async (p: unknown, args: never, ctx: GraphQLContext) => {
  const { id, input } = args as unknown as { id: string; input: InvoiceInput };
  const completed = { id, input: await completeInput(input) } as unknown as never;
  return crud.Mutation.updateInvoice(p, completed, ctx);
};

export const financeResolvers = {
  InvoiceLine: { amount: lineAmount },
  /** Written before these fields existed, a `.lean()` row comes back without them. */
  Invoice: {
    clientName: (invoice: { clientName?: string | null }) => invoice.clientName ?? '',
    lines: (invoice: { lines?: InvoiceLineInput[] | null }) => invoice.lines ?? [],
  },
  Query: { ...crud.Query, invoicePdf },
  Mutation: { ...crud.Mutation, createInvoice, updateInvoice, sendInvoice },
};
export { financeTypeDefs };
export { financeBillingTypeDefs } from './finance.billing.typeDefs';
export { financeBillingResolvers } from './finance.billing';
export { financeCompanyTypeDefs } from './finance.company.typeDefs';
export { financeCompanyResolvers, companyExpensesService } from './finance.company';
