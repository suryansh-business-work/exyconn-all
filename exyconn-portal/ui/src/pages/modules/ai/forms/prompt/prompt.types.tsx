import type { ListPromptsQuery } from '@/graphql/generated';

export type PromptRow = ListPromptsQuery['listPrompts'][number];
