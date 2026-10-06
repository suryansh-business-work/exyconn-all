import type { GatewayMode, ListPayoneerConfigsQuery } from '@exyconn/shell/graphql/generated';

export type PayoneerConfigRow = ListPayoneerConfigsQuery['listPayoneerConfigs'][number];

export interface PayoneerConfigFormValues {
  label: string;
  merchantCode: string;
  apiToken: string;
  division: string;
  mode: GatewayMode;
  isActive: 'true' | 'false';
}
