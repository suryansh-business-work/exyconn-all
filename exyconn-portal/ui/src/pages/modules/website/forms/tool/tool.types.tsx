import type { ListToolsQuery } from '../../../../../graphql/generated';

export type ToolRow = ListToolsQuery['listTools'][number];

/**
 * `pricing` and `seo` are deliberately absent: they are not part of the list query
 * and the server's update runs a partial `$set`, so omitting them preserves the
 * values already stored.
 */
export interface ToolFormValues {
  toolCode: string;
  categorySlug: string;
  name: string;
  description: string;
  longDescription: string;
  url: string;
  icon: string;
  color: string;
  features: string[];
  useCases: string[];
  keywords: string[];
  isActive: boolean;
  isMVP: boolean;
  order: number;
}
