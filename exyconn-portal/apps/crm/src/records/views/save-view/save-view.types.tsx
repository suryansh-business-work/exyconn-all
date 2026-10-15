import { z } from 'zod';

/** The server's limit on a view's name. */
export const MAX_VIEW_NAME = 60;

export const saveViewSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Give the view a name')
    .max(MAX_VIEW_NAME, 'A view name is at most 60 characters'),
  shared: z.boolean(),
});

export type SaveViewValues = z.infer<typeof saveViewSchema>;
