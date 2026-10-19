import { z } from 'zod';

/** The server refuses a shorter justification. */
export const MIN_JUSTIFICATION = 10;

export const removeSuppressionSchema = z.object({
  justification: z
    .string()
    .trim()
    .min(MIN_JUSTIFICATION, `Say why in at least ${MIN_JUSTIFICATION} characters`)
    .max(500, 'Keep it under 500 characters'),
  confirmEmail: z.string().trim(),
});

export type RemoveSuppressionValues = z.infer<typeof removeSuppressionSchema>;
