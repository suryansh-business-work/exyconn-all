import { z } from 'zod';

/** As much as one post may carry; the server holds the same ceiling on the column. */
export const MAX_POST_LENGTH = 5000;

/**
 * A post needs words. An image on its own reads as an accident on a feed where every
 * other entry says something, so the body is required and the picture is not.
 */
export const postSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write something before you post')
    .max(MAX_POST_LENGTH, `Keep a post under ${MAX_POST_LENGTH} characters`),
  imageUrl: z.string().trim(),
});

export type PostFormValues = z.infer<typeof postSchema>;
