import { z } from 'zod';
import type { AppSettingsQuery } from '@exyconn/shell/graphql/generated';

/** The settings record as returned by the codegen'd `AppSettings` query. */
export type AppSettingsRow = AppSettingsQuery['appSettings'];

/** date-fns patterns the portals may render dates and times with. */
export const DATE_FORMATS: readonly string[] = [
  'dd MMM yyyy',
  'dd/MM/yyyy',
  'MM/dd/yyyy',
  'yyyy-MM-dd',
];
export const TIME_FORMATS: readonly string[] = ['hh:mm a', 'HH:mm'];
/** IANA zones the browser knows — the one source for both the picker and the validator. */
export const TIMEZONES: readonly string[] = Intl.supportedValuesOf('timeZone');

const DATE_FORMAT_SET = new Set(DATE_FORMATS);
const TIME_FORMAT_SET = new Set(TIME_FORMATS);
const TIMEZONE_SET = new Set(TIMEZONES);

export const isTimezone = (value: string) => TIMEZONE_SET.has(value);

export const appSettingsSchema = z.object({
  dateFormat: z
    .string()
    .min(1, 'Date format is required')
    .refine((value) => DATE_FORMAT_SET.has(value), 'Choose a date format from the list'),
  timeFormat: z
    .string()
    .min(1, 'Time format is required')
    .refine((value) => TIME_FORMAT_SET.has(value), 'Choose a time format from the list'),
  timezone: z
    .string()
    .min(1, 'Timezone is required')
    .refine(isTimezone, 'Choose a timezone from the list'),
});

export type AppSettingsFormValues = z.infer<typeof appSettingsSchema>;

/** Maps the loaded record onto form values (drops `id`/`__typename`). */
export const toAppSettingsValues = (row: AppSettingsRow): AppSettingsFormValues => ({
  dateFormat: row.dateFormat,
  timeFormat: row.timeFormat,
  timezone: row.timezone,
});
