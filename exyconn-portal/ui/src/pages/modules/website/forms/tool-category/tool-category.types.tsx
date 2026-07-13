import type { ListToolCategoriesQuery } from '../../../../../graphql/generated';

export type ToolCategoryRow = ListToolCategoriesQuery['listToolCategories'][number];

export interface ToolCategoryFormValues {
  slug: string;
  category: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  order: number;
}
