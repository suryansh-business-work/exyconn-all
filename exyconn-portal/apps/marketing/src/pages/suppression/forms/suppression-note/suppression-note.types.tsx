import { z } from 'zod';
import { MAX_NOTE } from '../suppression';

export const suppressionNoteSchema = z.object({
  note: z.string().trim().max(MAX_NOTE, `Keep the note under ${MAX_NOTE} characters`),
});

export type SuppressionNoteValues = z.infer<typeof suppressionNoteSchema>;
