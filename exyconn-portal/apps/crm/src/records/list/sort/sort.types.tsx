import { z } from 'zod';
import { SortDir, type CrmSortInput } from '@exyconn/shell/graphql/generated';
import { MAX_SORTS } from '../../filters/operators';

/** One sort level as the form holds it; the property is empty until one is picked. */
export interface SortLevelDraft {
  property: string;
  dir: SortDir;
}

export interface SortFormValues {
  levels: SortLevelDraft[];
}

/** Up to three levels, each on a property, and no property twice. */
export const sortSchema = z
  .object({
    levels: z
      .array(
        z.object({
          property: z.string().trim().min(1, 'Choose a property to sort by'),
          dir: z.enum(SortDir),
        }),
      )
      .max(MAX_SORTS, 'Sort by at most 3 properties'),
  })
  .superRefine((values, ctx) => {
    const seen = new Set<string>();
    values.levels.forEach((level, index) => {
      if (level.property !== '' && seen.has(level.property)) {
        ctx.addIssue({
          code: 'custom',
          message: 'This property is already sorted on',
          path: ['levels', index, 'property'],
        });
      }
      seen.add(level.property);
    });
  });

export const emptySortLevel = (): SortLevelDraft => ({ property: '', dir: SortDir.Asc });

export const toSortFormValues = (sorts: readonly CrmSortInput[]): SortFormValues => ({
  levels: sorts.map(({ property, dir }) => ({ property, dir })),
});
