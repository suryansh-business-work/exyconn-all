import type { ListPromptsPagedQuery } from '@exyconn/shell/graphql/generated';

/** The prompt-library row a run is started from. */
export type RunPromptTarget = ListPromptsPagedQuery['listPromptsPaged']['rows'][number];

export interface RunPromptFormValues {
  model: string;
}
