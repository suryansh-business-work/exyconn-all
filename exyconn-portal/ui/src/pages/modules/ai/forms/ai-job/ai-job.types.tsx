import type { ListAiJobsQuery, AiJobStatus } from '../../../../../graphql/generated';

export type AiJobRow = ListAiJobsQuery['listAiJobs'][number];

export interface AiJobFormValues {
  name: string;
  model: string;
  prompt: string;
  status: AiJobStatus;
}
