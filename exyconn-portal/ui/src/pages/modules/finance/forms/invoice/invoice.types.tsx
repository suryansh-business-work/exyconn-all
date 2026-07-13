import type { ListInvoicesQuery, InvoiceStatus } from '../../../../../graphql/generated';

export type InvoiceRow = ListInvoicesQuery['listInvoices'][number];

export interface InvoiceFormValues {
  number: string;
  clientId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string;
}
