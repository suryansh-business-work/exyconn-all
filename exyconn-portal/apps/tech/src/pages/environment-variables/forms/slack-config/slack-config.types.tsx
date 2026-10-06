import type { ListSlackConfigsQuery } from '@exyconn/shell/graphql/generated';

export type SlackConfigRow = ListSlackConfigsQuery['listSlackConfigs'][number];

export interface SlackConfigFormValues {
  label: string;
  botToken: string;
  signingSecret: string;
  defaultChannel: string;
  isActive: 'true' | 'false';
}
