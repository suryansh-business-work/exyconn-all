import { z } from 'zod';
import {
  canonicalLocale,
  isDateFormat,
  isTimeFormat,
  isValidLocale,
  isValidTimezone,
} from '@exyconn/i18n';
import type { AppSettingsQuery } from '@exyconn/shell/graphql/generated';

/** The settings record as returned by the codegen'd `AppSettings` query. */
export type AppSettingsRow = AppSettingsQuery['appSettings'];

/**
 * Whether the runtime can resolve this zone.
 *
 * Deliberately the shared probe rather than membership of `Intl.supportedValuesOf`: that
 * list is the ICU zone list *pre-canonicalisation* and omits both `UTC` and `Asia/Kolkata`,
 * so testing membership would reject the very default this portal ships with.
 */
export const isTimezone = (value: string) => isValidTimezone(value);

export const appSettingsSchema = z.object({
  dateFormat: z
    .string()
    .min(1, 'Date format is required')
    .refine(isDateFormat, 'Choose a date format from the list'),
  timeFormat: z
    .string()
    .min(1, 'Time format is required')
    .refine(isTimeFormat, 'Choose a time format from the list'),
  timezone: z
    .string()
    .min(1, 'Timezone is required')
    .refine(isTimezone, 'Choose a timezone from the list'),
  defaultLocale: z
    .string()
    .min(1, 'A default language is required')
    .refine(isValidLocale, 'Enter a language tag like en, hi or pt-BR'),
  enabledLocales: z
    .array(z.string())
    .refine(
      (tags) => tags.every(isValidLocale),
      'Every language must be a tag like en, hi or pt-BR',
    ),
  autoTranslate: z.boolean(),
  // Kept as a string because the number input's empty state is '' rather than 0.
  auditRetentionDays: z.string().refine((value) => {
    const days = Number(value);
    return value !== '' && Number.isInteger(days) && days >= 0 && days <= 3650;
  }, 'Enter a whole number of days, 0 to keep for ever'),
});

export type AppSettingsFormValues = z.infer<typeof appSettingsSchema>;

/** Maps the loaded record onto form values (drops `id`/`__typename`). */
export const toAppSettingsValues = (row: AppSettingsRow): AppSettingsFormValues => ({
  dateFormat: row.dateFormat,
  timeFormat: row.timeFormat,
  timezone: row.timezone,
  defaultLocale: canonicalLocale(row.defaultLocale) ?? 'en',
  enabledLocales: [...row.enabledLocales],
  autoTranslate: row.autoTranslate,
  auditRetentionDays: String(row.auditRetentionDays),
});
