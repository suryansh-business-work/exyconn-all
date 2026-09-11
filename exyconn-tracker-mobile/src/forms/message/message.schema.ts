import { z } from 'zod';

/**
 * The portal's own bound on one message (TRACKER_MESSAGE_LIMITS.maxBodyChars): it refuses
 * anything longer, so the composer stops before the round trip does.
 */
export const MESSAGE_MAX_CHARS = 2000;

/** One line to whoever administers tracking — trimmed, never empty, never an essay. */
export const messageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Write a message first.')
    .max(MESSAGE_MAX_CHARS, `A message cannot be longer than ${MESSAGE_MAX_CHARS} characters.`),
});
