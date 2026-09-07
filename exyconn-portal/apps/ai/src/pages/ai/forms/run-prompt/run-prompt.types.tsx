import type { ListPromptsPagedQuery } from '@exyconn/shell/graphql/generated';

/** The prompt-library row a run is started from, including its `{{variables}}`. */
export type RunPromptTarget = ListPromptsPagedQuery['listPromptsPaged']['rows'][number];

export interface RunPromptFormValues {
  model: string;
  /** One entry per `{{placeholder}}` the prompt declares. Blank renders as nothing. */
  variables: Record<string, string>;
}

export interface RunPromptFormProps {
  prompt: RunPromptTarget;
  /** Hands back the job the run created, so its result can be opened. */
  onDone: (jobId: string) => void;
  onCancel: () => void;
}
