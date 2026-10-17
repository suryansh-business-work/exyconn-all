import { z } from 'zod';

/** The server accepts 3–1000 characters; the form says so before a round trip. */
export const aiInstructionSchema = z.object({
  instruction: z
    .string()
    .trim()
    .min(3, 'Write at least 3 characters')
    .max(1000, 'At most 1,000 characters'),
});

export type AiInstructionValues = z.infer<typeof aiInstructionSchema>;

/** What the form starts with when the page has not been sent to the AI before. */
export const DEFAULT_AI_INSTRUCTION =
  'Summarise what this business does, who it serves, its contact details, and one sales angle for us.';
