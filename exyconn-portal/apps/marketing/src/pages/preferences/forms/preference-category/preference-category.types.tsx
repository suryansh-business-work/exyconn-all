import { z } from 'zod';
import type { PreferenceCategoryFieldsFragment } from '@exyconn/shell/graphql/generated';

export type PreferenceCategoryRow = PreferenceCategoryFieldsFragment;

export const preferenceCategorySchema = z.object({
  name: z.string().trim().min(1, 'Name the category').max(80, 'Keep the name under 80 characters'),
  description: z.string().trim().max(300, 'Keep the description under 300 characters'),
  isActive: z.boolean(),
  sortOrder: z
    .number({ error: 'Enter a number' })
    .int('Use a whole number')
    .min(0, 'Use 0 or more')
    .max(999, 'Use 999 or less'),
});

export type PreferenceCategoryValues = z.infer<typeof preferenceCategorySchema>;

export const toCategoryValues = (row: PreferenceCategoryRow | null): PreferenceCategoryValues => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
  isActive: row?.isActive ?? true,
  sortOrder: row?.sortOrder ?? 0,
});
