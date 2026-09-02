import type { ListEmailConfigsQuery } from '@exyconn/shell/graphql/generated';

export type EmailConfigRow = ListEmailConfigsQuery['listEmailConfigs'][number];

export interface EmailConfigFormValues {
  label: string;
  host: string;
  port: string;
  secure: 'true' | 'false';
  username: string;
  password: string;
  fromAddress: string;
  isActive: 'true' | 'false';
}
