import type {
  ListRecurringInvoicesPagedQuery,
  RecurrenceFrequency,
} from '@exyconn/shell/graphql/generated';

/** One schedule as the grid and the form read it — codegen-derived, never hand-typed. */
export type RecurringInvoiceRow =
  ListRecurringInvoicesPagedQuery['listRecurringInvoicesPaged']['rows'][number];

/** One billed line as the form edits it. The amount is derived, never typed. */
export interface RecurringLineValues {
  description: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  hsnSac: string;
}

export interface RecurringInvoiceFormValues {
  name: string;
  clientId: string;
  lines: RecurringLineValues[];
  currency: string;
  placeOfSupplyStateCode: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string;
  dueDays: number;
  active: boolean;
}
