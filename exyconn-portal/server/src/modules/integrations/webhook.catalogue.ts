import type { WebhookEvent } from './webhook.model';

/** What one event means, which module sends it, and the fields its `data` carries. */
export interface WebhookEventInfo {
  event: WebhookEvent;
  module: string;
  description: string;
  fields: readonly string[];
}

/**
 * The webhook event catalogue the developer portal shows. Keyed by WEBHOOK_EVENTS, so an event
 * added there without a line here fails to compile instead of appearing undocumented. The
 * fields mirror what each emit site puts in the payload's `data`.
 */
const CATALOGUE: Record<WebhookEvent, Omit<WebhookEventInfo, 'event'>> = {
  'invoice.created': {
    module: 'Finance',
    description: 'An invoice was raised for a client.',
    fields: [
      'invoiceId',
      'number',
      'clientId',
      'clientName',
      'amount',
      'currency',
      'status',
      'dueDate',
    ],
  },
  'invoice.paid': {
    module: 'Finance',
    description: 'A payment settled an invoice in full.',
    fields: ['invoiceId', 'number', 'clientId', 'clientName', 'amount', 'currency', 'paidAt'],
  },
  'lead.created': {
    module: 'CRM',
    description: 'A lead was added to the CRM.',
    fields: [
      'leadId',
      'name',
      'email',
      'source',
      'stage',
      'value',
      'owner',
      'campaignId',
      'campaignName',
    ],
  },
  'deal.won': {
    module: 'CRM',
    description: 'A deal moved to won.',
    fields: [
      'dealId',
      'title',
      'companyName',
      'contactName',
      'value',
      'owner',
      'clientId',
      'wonAt',
    ],
  },
  'ticket.created': {
    module: 'Support',
    description: 'A support ticket was opened, from any channel.',
    fields: [
      'ticketId',
      'reference',
      'subject',
      'category',
      'priority',
      'status',
      'channel',
      'requesterType',
      'requesterName',
      'requesterEmail',
      'clientId',
      'clientName',
    ],
  },
  'purchase_order.received': {
    module: 'Products',
    description: 'Goods on a purchase order were booked in.',
    fields: [
      'purchaseOrderId',
      'number',
      'supplierId',
      'supplierName',
      'total',
      'currency',
      'receivedAt',
    ],
  },
  'purchase_order.acknowledged': {
    module: 'Products',
    description: 'A supplier confirmed a purchase order in the vendor portal.',
    fields: [
      'purchaseOrderId',
      'number',
      'supplierId',
      'supplierName',
      'acknowledgedBy',
      'acknowledgedAt',
    ],
  },
  'vendor_invoice.submitted': {
    module: 'Products',
    description: 'A supplier sent an invoice against a purchase order in the vendor portal.',
    fields: [
      'vendorInvoiceId',
      'invoiceNumber',
      'purchaseOrderNumber',
      'supplierId',
      'supplierName',
      'amount',
      'currency',
      'orderTotal',
    ],
  },
};

/** Every event, in the order WEBHOOK_EVENTS lists them. */
export function webhookEventCatalogue(events: readonly WebhookEvent[]): WebhookEventInfo[] {
  return events.map((event) => ({ event, ...CATALOGUE[event] }));
}
