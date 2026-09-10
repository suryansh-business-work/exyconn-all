import { InvoiceModel } from './finance.model';
import { financeTypeDefs } from './finance.typeDefs';
import { gstBreakdown, invoiceAmount, lineAmount, type InvoiceLineInput } from './invoice.lines';
import { invoicePdf, sendInvoice } from './invoice.send';
import { createInvoiceFromDeal } from './invoice.from-deal';
import { createInvoiceFromTimeLog } from './invoice.from-timelog';
import { GST_STATES } from './gst.constants';
import { createCrudService } from '../../lib/crudService';
import { createCrudResolvers } from '../../lib/crudResolvers';
import { ROLES } from '../../constants/roles';
import { assertAuthenticated } from '../../middleware/roleGuard';
import { badRequest } from '../../utils/errors';
import { clientNameFor } from '../clients';
import { getBranding } from '../branding/branding.service';
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
  placeOfSupplyStateCode?: string | null;
  supplierStateCode?: string;
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
 * What the form sends, made whole: the client's name looked up from its id, the amount
 * settled from the lines and our GST state copied from Branding. All are decided here
 * rather than trusted from the client, so an invoice can never carry a name, a total or a
 * tax split that its own rows disagree with.
 */
async function completeInput(input: InvoiceInput): Promise<InvoiceInput> {
  const amount = invoiceAmount(input);
  if (amount === null) {
    badRequest('Enter an amount, or add at least one line.');
  }
  const [clientName, branding] = await Promise.all([clientNameFor(input.clientId), getBranding()]);
  return {
    ...input,
    lines: input.lines ?? [],
    amount,
    clientName,
    placeOfSupplyStateCode: input.placeOfSupplyStateCode ?? '',
    supplierStateCode: branding.stateCode,
  };
}

/** A read-only, business-configured list; any signed-in user may pick from it. */
const gstStates = (_p: unknown, _a: unknown, ctx: GraphQLContext) => {
  assertAuthenticated(ctx);
  return GST_STATES;
};

/** The stored fields the GST split is computed from. */
type GstRow = Parameters<typeof gstBreakdown>[0];

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
  InvoiceLine: {
    amount: lineAmount,
    hsnSac: (line: { hsnSac?: string | null }) => line.hsnSac ?? '',
  },
  /** Written before these fields existed, a `.lean()` row comes back without them. */
  Invoice: {
    clientName: (invoice: { clientName?: string | null }) => invoice.clientName ?? '',
    lines: (invoice: { lines?: InvoiceLineInput[] | null }) => invoice.lines ?? [],
    dealId: (invoice: { dealId?: string | null }) => invoice.dealId ?? '',
    placeOfSupplyStateCode: (invoice: GstRow) => invoice.placeOfSupplyStateCode ?? '',
    supplierStateCode: (invoice: GstRow) => invoice.supplierStateCode ?? '',
    subtotal: (invoice: GstRow) => gstBreakdown(invoice).subtotal,
    taxTotal: (invoice: GstRow) => gstBreakdown(invoice).taxTotal,
    cgst: (invoice: GstRow) => gstBreakdown(invoice).cgst,
    sgst: (invoice: GstRow) => gstBreakdown(invoice).sgst,
    igst: (invoice: GstRow) => gstBreakdown(invoice).igst,
  },
  Query: { ...crud.Query, invoicePdf, gstStates },
  Mutation: {
    ...crud.Mutation,
    createInvoice,
    updateInvoice,
    sendInvoice,
    createInvoiceFromDeal,
    createInvoiceFromTimeLog,
  },
};
export { financeTypeDefs };
export { nextInvoiceNumber } from './invoice.number';
export { GST_STATES, gstStateLabel } from './gst.constants';
export { financeBillingTypeDefs } from './finance.billing.typeDefs';
export { financeBillingResolvers } from './finance.billing';
export { financeCompanyTypeDefs } from './finance.company.typeDefs';
export { financeCompanyResolvers, companyExpensesService } from './finance.company';
export { financeBudgetTypeDefs } from './finance.budgets.typeDefs';
export { financeBudgetResolvers, costCentersService, budgetsService } from './finance.budgets';
export { financeRecurringTypeDefs } from './finance.recurring.typeDefs';
export {
  recurringInvoiceResolvers,
  recurringInvoiceService,
  generateDueInvoices,
  startRecurringInvoiceSchedule,
} from './finance.recurring';
