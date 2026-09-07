import type { AiSpendLimitQuery } from '@exyconn/shell/graphql/generated';

export type AiSpendLimit = AiSpendLimitQuery['aiSpendLimit'];

/** Exactly what the budget form collects. A cap of zero means no cap on that axis. */
export interface AiSpendLimitFormValues {
  monthlyUsdCap: number;
  perUserDailyUsdCap: number;
  enabled: boolean;
}
