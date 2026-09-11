import type { z } from 'zod';
import type { manualEntrySchema } from './manual-entry.schema';

/** What the claim form holds while it is filled in; instants are ISO strings, as picked. */
export type ManualEntryInput = z.input<typeof manualEntrySchema>;

/** What it files, the note already trimmed — the controller's ManualEntryDraft, exactly. */
export type ManualEntryValues = z.output<typeof manualEntrySchema>;
