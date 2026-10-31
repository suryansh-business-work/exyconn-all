import { z } from 'zod';

/** The most argument text the playground sends to one tool. */
export const MAX_ARGUMENTS_LENGTH = 10_000;

/** Whether the text reads as one JSON object (not an array, a string or a number). */
export function isJsonObject(text: string): boolean {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  } catch {
    return false;
  }
}

/** A tool's arguments, written as a JSON object. */
export const toolCallSchema = z.object({
  args: z
    .string()
    .trim()
    .min(2, 'Write the arguments, or {} when the tool takes none')
    .max(MAX_ARGUMENTS_LENGTH, 'At most 10,000 characters')
    .refine(isJsonObject, 'Write the arguments as one JSON object, like {"page": 1}'),
});

export type ToolCallValues = z.infer<typeof toolCallSchema>;
