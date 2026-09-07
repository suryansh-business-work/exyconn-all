import type { PagedInvoiceRow } from '../../invoices-grid';

/** The invoice a send is about: the grid row, which carries the client id the email comes from. */
export type SendInvoiceTarget = PagedInvoiceRow;

export interface SendInvoiceFormValues {
  email: string;
  message: string;
}
