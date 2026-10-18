import { z } from 'zod';

export const callNoteSchema = z.object({
  notes: z
    .string()
    .trim()
    .min(1, 'Write the note')
    .max(10_000, 'Keep the notes under 10,000 characters'),
});

export type CallNoteValues = z.infer<typeof callNoteSchema>;
