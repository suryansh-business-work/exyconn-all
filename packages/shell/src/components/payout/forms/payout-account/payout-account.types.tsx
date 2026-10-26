import type {
  PayoutAccountFieldsFragment,
  PayoutAccountInput,
  PayoutSecretField,
} from '@/graphql/generated';
import type { PayoutDetails } from '@exyconn/payout';

/** One saved account as every list and form reads it (secrets only as masked hints). */
export type PayoutAccountRow = PayoutAccountFieldsFragment;

/** The form: every payout detail as typed, plus whether it is the default account. */
export type PayoutAccountFormValues = PayoutDetails & { isPrimary: boolean };

/**
 * Where a payout form saves and reveals — HR's salary accounts and the client hub's refund
 * accounts reach different API fields, so each screen hands the form its own pair.
 */
export interface PayoutAccountApi {
  save: (id: string | null, input: PayoutAccountInput) => Promise<unknown>;
  reveal: (row: PayoutAccountRow, field: PayoutSecretField) => Promise<string>;
}
