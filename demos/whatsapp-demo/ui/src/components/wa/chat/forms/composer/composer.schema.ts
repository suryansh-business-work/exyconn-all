import { z } from 'zod';

/** Longest message the composer sends — WhatsApp's own limit is far higher; a demo needs less. */
export const MAX_MESSAGE_LENGTH = 1000;

export const composerSchema = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
});
