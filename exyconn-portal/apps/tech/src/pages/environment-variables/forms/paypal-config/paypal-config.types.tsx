import type { GatewayMode, ListPaypalConfigsQuery } from '@exyconn/shell/graphql/generated';

export type PaypalConfigRow = ListPaypalConfigsQuery['listPaypalConfigs'][number];

export interface PaypalConfigFormValues {
  label: string;
  clientId: string;
  clientSecret: string;
  webhookId: string;
  mode: GatewayMode;
  isActive: 'true' | 'false';
}
