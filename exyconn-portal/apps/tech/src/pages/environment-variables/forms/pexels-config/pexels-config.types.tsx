import type { ListPexelsConfigsQuery } from '@exyconn/shell/graphql/generated';

export type PexelsConfigRow = ListPexelsConfigsQuery['listPexelsConfigs'][number];

export interface PexelsConfigFormValues {
  label: string;
  apiKey: string;
  isActive: 'true' | 'false';
}
