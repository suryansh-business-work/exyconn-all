import type { ListGodaddyConfigsQuery } from '@exyconn/shell/graphql/generated';

export type GodaddyConfigRow = ListGodaddyConfigsQuery['listGodaddyConfigs'][number];

export interface GodaddyConfigFormValues {
  label: string;
  apiKey: string;
  apiSecret: string;
  isActive: 'true' | 'false';
}
