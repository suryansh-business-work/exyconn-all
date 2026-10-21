import { z } from 'zod';
import type { LegalGroupFieldsFragment } from '@exyconn/shell/graphql/generated';

/** A group as Legal › Groups lists it. */
export type LegalGroupRow = LegalGroupFieldsFragment;

export const legalGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .min(2, 'Minimum 2 characters')
    .max(120, 'Keep the name under 120 characters'),
  description: z.string().trim().max(1000, 'Keep the description under 1000 characters'),
});

export type LegalGroupFormValues = z.infer<typeof legalGroupSchema>;

export const toLegalGroupValues = (row: LegalGroupRow | null): LegalGroupFormValues => ({
  name: row?.name ?? '',
  description: row?.description ?? '',
});
