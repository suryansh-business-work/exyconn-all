import type { ListSonarConfigsQuery } from '@exyconn/shell/graphql/generated';

export type SonarConfigRow = ListSonarConfigsQuery['listSonarConfigs'][number];

export interface SonarConfigFormValues {
  label: string;
  hostUrl: string;
  token: string;
  projectKey: string;
  organization: string;
  isActive: 'true' | 'false';
}
