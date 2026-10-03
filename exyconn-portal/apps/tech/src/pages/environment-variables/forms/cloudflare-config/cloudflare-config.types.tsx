import type { ListCloudflareConfigsQuery } from '@exyconn/shell/graphql/generated';

export type CloudflareConfigRow = ListCloudflareConfigsQuery['listCloudflareConfigs'][number];

export interface CloudflareConfigFormValues {
  label: string;
  apiToken: string;
  accountId: string;
  isActive: 'true' | 'false';
}
