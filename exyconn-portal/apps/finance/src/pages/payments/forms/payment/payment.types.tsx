import type { PaymentFieldsFragment } from '@exyconn/shell/graphql/generated';

export type PaymentRow = PaymentFieldsFragment;

export interface PaymentFormValues {
  invoiceId: string;
  amount: number;
  method: string;
  reference: string;
  notes: string;
}
