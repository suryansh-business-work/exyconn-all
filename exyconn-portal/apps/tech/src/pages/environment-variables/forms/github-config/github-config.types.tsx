import type { ListGithubConfigsQuery } from '@exyconn/shell/graphql/generated';

export type GithubConfigRow = ListGithubConfigsQuery['listGithubConfigs'][number];

export interface GithubConfigFormValues {
  label: string;
  owner: string;
  repo: string;
  token: string;
  isActive: 'true' | 'false';
}
