import type { ListInboundMailConfigsQuery } from '@exyconn/shell/graphql/generated';

export type InboundMailConfigRow = ListInboundMailConfigsQuery['listInboundMailConfigs'][number];

export interface InboundMailConfigFormValues {
  label: string;
  host: string;
  port: number;
  secure: 'true' | 'false';
  user: string;
  /** Write-only: the API never returns it, so an empty value keeps the stored one. */
  password: string;
  mailbox: string;
  pollSeconds: number;
  deleteAfterImport: 'true' | 'false';
  isActive: 'true' | 'false';
}
