import { z } from 'zod';
import { PAGE_PATH } from '@exyconn/regex';

/** The page being copied. */
export interface DuplicateSource {
  id: string;
  path: string;
  title: string;
}

export const duplicateSchema = z.object({
  path: z
    .string()
    .trim()
    .min(1, 'Path is required')
    .max(200, 'Keep the path under 200 characters')
    .regex(PAGE_PATH, 'Use a path like /about-us: lower-case letters, digits and dashes'),
});

export type DuplicateFormValues = z.infer<typeof duplicateSchema>;
