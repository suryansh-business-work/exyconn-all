import { z } from 'zod';
import { SLUG } from '@exyconn/regex';
import type { MeetingTypeFieldsFragment } from '@exyconn/shell/graphql/generated';

export type MeetingTypeRow = MeetingTypeFieldsFragment;

/** Monday first, as a week reads; `day` is 0 = Sunday like the server's. */
export const WEEK = [
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
  { day: 0, label: 'Sunday' },
] as const;

const wholeNumber = (min: number, max: number, message: string) =>
  z.coerce.number().int(message).min(min, message).max(max, message);

const hoursSchema = z
  .object({ day: z.number(), enabled: z.boolean(), start: z.string(), end: z.string() })
  .refine(
    (hours) =>
      !hours.enabled || (hours.start !== '' && hours.end !== '' && hours.start < hours.end),
    {
      path: ['end'],
      message: 'End after the start',
    },
  );

export const meetingTypeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Give the meeting a name')
    .max(120, 'Keep the name under 120 characters'),
  slug: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters')
    .max(60, 'Keep the link under 60 characters')
    .regex(SLUG, 'Use lower-case letters, digits and dashes'),
  description: z.string().trim().max(2000, 'Keep the description under 2000 characters'),
  durationMinutes: wholeNumber(5, 480, 'Between 5 and 480 minutes'),
  location: z.string().trim().max(500, 'Keep the location under 500 characters'),
  timezone: z.string().trim().min(1, 'Pick a time zone'),
  weeklyHours: z
    .array(hoursSchema)
    .refine((days) => days.some((d) => d.enabled), 'Make at least one day available'),
  bufferMinutes: wholeNumber(0, 240, 'Between 0 and 240 minutes'),
  minNoticeHours: wholeNumber(0, 720, 'Between 0 and 720 hours'),
  maxDaysAhead: wholeNumber(1, 365, 'Between 1 and 365 days'),
  active: z.boolean(),
});

export type MeetingTypeValues = z.infer<typeof meetingTypeSchema>;

/** Monday to Friday, 09:00–17:00, until somebody says otherwise. */
const defaultHours = () =>
  WEEK.map(({ day }) => ({ day, enabled: day >= 1 && day <= 5, start: '09:00', end: '17:00' }));

export const toMeetingTypeValues = (
  row: MeetingTypeRow | null,
  zone: string,
): MeetingTypeValues => ({
  title: row?.title ?? '',
  slug: row?.slug ?? '',
  description: row?.description ?? '',
  durationMinutes: row?.durationMinutes ?? 30,
  location: row?.location ?? '',
  timezone: row?.timezone ?? zone,
  weeklyHours: row
    ? WEEK.map(({ day }) => {
        const saved = row.weeklyHours.find((h) => h.day === day);
        return {
          day,
          enabled: saved?.enabled ?? false,
          start: saved?.start ?? '09:00',
          end: saved?.end ?? '17:00',
        };
      })
    : defaultHours(),
  bufferMinutes: row?.bufferMinutes ?? 0,
  minNoticeHours: row?.minNoticeHours ?? 4,
  maxDaysAhead: row?.maxDaysAhead ?? 30,
  active: row?.active ?? true,
});

/** A link-safe slug from a name: "Intro call (30 min)" → "intro-call-30-min". */
export const slugFrom = (title: string) =>
  title
    .toLowerCase()
    .split('')
    .map((c) => ((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9') ? c : '-'))
    .join('')
    .split('-')
    .filter(Boolean)
    .join('-')
    .slice(0, 60);
