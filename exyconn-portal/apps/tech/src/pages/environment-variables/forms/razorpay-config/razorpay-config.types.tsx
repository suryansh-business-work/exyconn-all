import type { ListRazorpayConfigsQuery } from '@exyconn/shell/graphql/generated';

export type RazorpayConfigRow = ListRazorpayConfigsQuery['listRazorpayConfigs'][number];

export interface RazorpayConfigFormValues {
  label: string;
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isActive: 'true' | 'false';
}
