import { PRESENCE_OPTIONS, type PresenceStatus } from '@exyconn/tracker-core';
import { z } from 'zod';

/** The portal keeps the first 120 characters of a presence note — the form says so up front. */
export const PRESENCE_NOTE_MAX = 120;

const offered = (value: unknown): boolean =>
  PRESENCE_OPTIONS.some((option) => option.status === value);

/**
 * What the employee is doing right now, in their own words. The status is one of the shared
 * PRESENCE_OPTIONS; the note ("Back at 2") is optional and trimmed.
 */
export const presenceSchema = z.object({
  status: z.custom<PresenceStatus>(offered, 'Choose what you are doing.'),
  note: z
    .string()
    .trim()
    .max(PRESENCE_NOTE_MAX, `Keep the note to ${PRESENCE_NOTE_MAX} characters.`),
});
