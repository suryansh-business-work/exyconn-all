import { z } from 'zod';

/** As much as one comment may carry; the server holds the same ceiling on the column. */
export const MAX_COMMENT_LENGTH = 2000;

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write something before you comment')
    .max(MAX_COMMENT_LENGTH, `Keep a comment under ${MAX_COMMENT_LENGTH} characters`),
});

export type CommentFormValues = z.infer<typeof commentSchema>;
