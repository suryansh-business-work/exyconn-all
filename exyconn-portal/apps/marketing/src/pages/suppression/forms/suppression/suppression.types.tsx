import type {
  MarketingSuppressionFieldsFragment,
  SuppressionReason,
} from '@exyconn/shell/graphql/generated';

export type SuppressionRow = MarketingSuppressionFieldsFragment;

export interface SuppressionFormValues {
  email: string;
  reason: SuppressionReason;
  source: string;
}
