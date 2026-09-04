import type { ListAiJobsQuery } from '@exyconn/shell/graphql/generated';

export type AiJobRow = ListAiJobsQuery['listAiJobs'][number];

export interface AiJobFormValues {
  name: string;
  model: string;
  prompt: string;
}
