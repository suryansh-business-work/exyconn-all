import { z } from 'zod';
import type { LogActivityTarget } from '../log-activity';

/** What a reminder is about: the contact or company whose page it was set from. */
export type ReminderTarget = LogActivityTarget;

/** A reminder must be for later than now — one already past would never be emailed on time. */
const inFuture = (value: string): boolean => {
  const at = new Date(value);
  return !Number.isNaN(at.getTime()) && at.getTime() > Date.now();
};

export const addReminderSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'Say what to be reminded about')
    .max(200, 'Keep the title under 200 characters'),
  remindAt: z
    .string()
    .min(1, 'Pick when to be reminded')
    .refine(inFuture, 'Pick a time in the future'),
  notes: z.string().trim().max(10_000, 'Keep the note under 10,000 characters'),
  assigneeId: z.string().min(1, 'Choose who to remind'),
});

export type AddReminderValues = z.infer<typeof addReminderSchema>;

/** A blank reminder for the signed-in person. */
export const addReminderDefaults = (assigneeId: string): AddReminderValues => ({
  subject: '',
  remindAt: '',
  notes: '',
  assigneeId,
});
