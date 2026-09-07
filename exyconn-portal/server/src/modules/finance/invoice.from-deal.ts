import { InvoiceModel } from './finance.model';
import { nextInvoiceNumber } from './invoice.number';
import { DealModel } from '../crm/deal.model';
import { ClientModel } from '../clients/clients.model';
import { getBranding } from '../branding/branding.service';
import { assertRole } from '../../middleware/roleGuard';
import { ROLES } from '../../constants/roles';
import { withId } from '../../utils/serialize';
import { badRequest, notFound } from '../../utils/errors';
import type { GraphQLContext } from '../../middleware/auth';

/** Sales raises the invoice the moment a deal closes; Finance can too. */
const invoicingRoles = [ROLES.FINANCE, ROLES.CRM];

const DAY_MS = 86_400_000;

/** Standard payment terms for a generated invoice. */
const DUE_IN_DAYS = 30;

/**
 * A draft invoice for a won deal: one line for the deal's value, numbered from the series,
 * due in thirty days, at the tax rate Branding defaults to.
 *
 * Only a WON deal that has become a client can be billed — the client is what the invoice
 * hangs off — and a deal is billed once: a second call is refused with the number of the
 * invoice that already exists, so nobody sends the same customer the same bill twice.
 */
export async function createInvoiceFromDeal(
  _p: unknown,
  { dealId }: { dealId: string },
  ctx: GraphQLContext,
) {
  assertRole(ctx, invoicingRoles);
  const deal = await DealModel.findById(dealId).lean();
  if (!deal) {
    notFound('Deal');
  }
  if (deal.stage !== 'WON') {
    badRequest(`Deal "${deal.title}" has not been won yet.`);
  }
  if (!deal.clientId) {
    badRequest(`Deal "${deal.title}" has no client. Mark it won again to create one.`);
  }
  const existing = await InvoiceModel.findOne({ dealId }).select('number').lean();
  if (existing) {
    badRequest(`Deal "${deal.title}" is already billed on invoice ${existing.number}.`);
  }
  const client = await ClientModel.findById(deal.clientId).lean();
  if (!client) {
    notFound('Client');
  }

  const [branding, number] = await Promise.all([getBranding(), nextInvoiceNumber()]);
  const issuedDate = new Date();
  const created = await InvoiceModel.create({
    number,
    clientId: String(client._id),
    clientName: client.name,
    dealId,
    lines: [
      { description: deal.title, quantity: 1, rate: deal.value, taxPercent: branding.defaultTaxPercent },
    ],
    amount: Math.round(deal.value * (1 + branding.defaultTaxPercent / 100) * 100) / 100,
    currency: 'INR',
    status: 'DRAFT',
    issuedDate,
    dueDate: new Date(issuedDate.getTime() + DUE_IN_DAYS * DAY_MS),
    placeOfSupplyStateCode: client.stateCode ?? '',
    supplierStateCode: branding.stateCode,
  });
  return withId(created.toObject());
}
