import { z } from 'zod';
import { ActivityType } from '@exyconn/shell/graphql/generated';

/** The kinds a person logs by hand; emails arrive through Gmail, not this form. */
export const LOGGABLE_TYPES = [
  ActivityType.Note,
  ActivityType.Call,
  ActivityType.Meeting,
  ActivityType.Task,
] as const;

const attachmentSchema = z.object({ url: z.string(), name: z.string(), contentType: z.string() });

export const logActivitySchema = z
  .object({
    type: z.enum(LOGGABLE_TYPES),
    subject: z
      .string()
      .trim()
      .min(1, 'Say what it was about')
      .max(200, 'Keep the subject under 200 characters'),
    notes: z.string().trim().max(10_000, 'Keep the notes under 10,000 characters'),
    durationMinutes: z
      .string()
      .trim()
      .refine(
        (value) => value === '' || (/^\d+$/.test(value) && Number(value) <= 24 * 60),
        'Enter minutes, up to 1440',
      ),
    dueDate: z.string(),
    done: z.boolean(),
    attachments: z.array(attachmentSchema),
  })
  .refine((values) => values.type !== ActivityType.Task || values.dueDate !== '', {
    path: ['dueDate'],
    message: 'Pick when the task is due',
  });

export type LogActivityValues = z.infer<typeof logActivitySchema>;

export const logActivityDefaults = (type: LogActivityValues['type']): LogActivityValues => ({
  type,
  subject: '',
  notes: '',
  durationMinutes: '',
  dueDate: '',
  done: type !== ActivityType.Task,
  attachments: [],
});

/** What the activity is about: the contact or company whose page it was logged from. */
export interface LogActivityTarget {
  relatedType: 'CONTACT' | 'COMPANY';
  relatedId: string;
  relatedName: string;
}
