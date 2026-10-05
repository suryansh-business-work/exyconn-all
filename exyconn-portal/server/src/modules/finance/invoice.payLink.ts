import { env } from '../../config/env';

/** Where an invoice email's "Pay now" button goes: the invoice in the client hub, ready to pay. */
export const invoicePayUrl = (invoiceId: string): string =>
  `${env.clientHubUrl}/invoices?pay=${encodeURIComponent(invoiceId)}`;
