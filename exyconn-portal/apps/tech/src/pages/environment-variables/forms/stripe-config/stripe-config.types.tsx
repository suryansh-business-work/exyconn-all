import type { ListStripeConfigsQuery } from '@exyconn/shell/graphql/generated';

export type StripeConfigRow = ListStripeConfigsQuery['listStripeConfigs'][number];

export interface StripeConfigFormValues {
  label: string;
  secretKey: string;
  webhookSecret: string;
  isActive: 'true' | 'false';
}
