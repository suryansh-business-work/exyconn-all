import {
  AiJobStatus,
  PromptCategory,
  type GetAiJobQuery,
  type ListAiJobsPagedQuery,
  type ListPromptsPagedQuery,
} from '@exyconn/shell/graphql/generated';

export type JobDetail = GetAiJobQuery['getAiJob'];
export type PagedJob = ListAiJobsPagedQuery['listAiJobsPaged']['rows'][number];
export type PagedPrompt = ListPromptsPagedQuery['listPromptsPaged']['rows'][number];

/** A settled job as the result dialog reads it. */
export const jobDetail = (over: Partial<JobDetail> = {}): JobDetail => ({
  id: 'job-1',
  name: 'Weekly digest',
  model: 'gpt-4o-mini',
  prompt: 'Summarise the week',
  status: AiJobStatus.Succeeded,
  response: 'A quiet week.',
  error: '',
  promptTokens: 1000,
  completionTokens: 234,
  totalTokens: 1234,
  costUsd: 0.0123,
  latencyMs: 1500,
  queuedAt: '2026-10-01T09:59:00.000Z',
  ranAt: '2026-10-01T10:00:00.000Z',
  createdByName: 'Asha',
  ...over,
});

/** A row of the server-paged jobs grid. */
export const pagedJob = (over: Partial<PagedJob> = {}): PagedJob => ({
  id: 'job-1',
  name: 'Digest',
  model: 'gpt-4o-mini',
  prompt: 'Summarise',
  status: AiJobStatus.Succeeded,
  totalTokens: 1234,
  costUsd: 0.01,
  latencyMs: 800,
  queuedAt: null,
  ranAt: '2026-10-01T10:00:00.000Z',
  createdByName: 'Asha',
  ...over,
});

/** A row of the server-paged prompt library. */
export const pagedPrompt = (over: Partial<PagedPrompt> = {}): PagedPrompt => ({
  id: 'prompt-1',
  title: 'Weekly digest',
  category: PromptCategory.Writing,
  content: 'Write to {{company}} about {{product}}',
  description: null,
  tags: ['weekly'],
  variables: ['company', 'product'],
  ...over,
});

/** A TableStats answer with the given total, per-field counts and sums. */
export const tableStats = (
  total: number,
  counts: Record<string, Record<string, number>>,
  sums: Record<string, number> = {},
) => ({
  total,
  counts: Object.entries(counts).map(([field, buckets]) => ({
    field,
    buckets: Object.entries(buckets).map(([value, count]) => ({ value, count })),
  })),
  sums: Object.entries(sums).map(([field, sum]) => ({ field, total: sum })),
});
