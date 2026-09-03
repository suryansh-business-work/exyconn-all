import type { ListOpenAiConfigsQuery } from '@exyconn/shell/graphql/generated';

export type OpenAiConfigRow = ListOpenAiConfigsQuery['listOpenAiConfigs'][number];

export interface OpenAiConfigFormValues {
  label: string;
  apiKey: string;
  defaultModel: string;
  isActive: 'true' | 'false';
}
