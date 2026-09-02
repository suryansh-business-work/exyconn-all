import type { ListPromptsQuery } from '@exyconn/shell/graphql/generated';

export type PromptRow = ListPromptsQuery['listPrompts'][number];
