import { describe, expect, it } from 'vitest';
import {
  DATE_FORMATS,
  TIME_FORMATS,
  appSettingsSchema,
  isTimezone,
  toAppSettingsValues,
  type AppSettingsFormValues,
} from '../../../../src/pages/app-settings/forms/app-settings';
import { appSettings } from './app-settings.fixtures';

const valid: AppSettingsFormValues = {
  dateFormat: 'dd MMM yyyy',
  timeFormat: 'HH:mm',
  timezone: 'Asia/Kolkata',
  defaultLocale: 'en',
  enabledLocales: ['hi', 'pt-BR'],
  autoTranslate: true,
  auditRetentionDays: '0',
};

/** The first message Zod reports for each field — the one the form shows under it. */
function errorsFor(overrides: Partial<AppSettingsFormValues>): Record<string, string> {
  const result = appSettingsSchema.safeParse({ ...valid, ...overrides });
  const errors: Record<string, string> = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path.join('.')] ??= issue.message;
  }
  return errors;
}

describe('appSettingsSchema', () => {
  it('accepts every offered pattern, a real zone and a retention within ten years', () => {
    expect(appSettingsSchema.safeParse(valid).success).toBe(true);
    for (const dateFormat of DATE_FORMATS) {
      expect(errorsFor({ dateFormat })).toEqual({});
    }
    for (const timeFormat of TIME_FORMATS) {
      expect(errorsFor({ timeFormat })).toEqual({});
    }
    expect(errorsFor({ auditRetentionDays: '3650' })).toEqual({});
  });

  it('requires a date format, a time format and a timezone', () => {
    expect(errorsFor({ dateFormat: '' }).dateFormat).toBe('Date format is required');
    expect(errorsFor({ timeFormat: '' }).timeFormat).toBe('Time format is required');
    expect(errorsFor({ timezone: '' }).timezone).toBe('Timezone is required');
    expect(errorsFor({ defaultLocale: '' }).defaultLocale).toBe('A default language is required');
  });

  it('rejects a pattern or a zone that is not on the list', () => {
    expect(errorsFor({ dateFormat: 'yyyy' }).dateFormat).toBe('Choose a date format from the list');
    expect(errorsFor({ timeFormat: 'H' }).timeFormat).toBe('Choose a time format from the list');
    expect(errorsFor({ timezone: 'Mars/Olympus' }).timezone).toBe(
      'Choose a timezone from the list',
    );
  });

  it('rejects language tags the runtime cannot resolve', () => {
    expect(errorsFor({ defaultLocale: 'not a tag' }).defaultLocale).toBe(
      'Enter a language tag like en, hi or pt-BR',
    );
    expect(errorsFor({ enabledLocales: ['hi', 'not a tag'] }).enabledLocales).toBe(
      'Every language must be a tag like en, hi or pt-BR',
    );
  });

  it('takes the retention as whole days from 0 to 3650, and never blank', () => {
    const message = 'Enter a whole number of days, 0 to keep for ever';
    expect(errorsFor({ auditRetentionDays: '' }).auditRetentionDays).toBe(message);
    expect(errorsFor({ auditRetentionDays: '-1' }).auditRetentionDays).toBe(message);
    expect(errorsFor({ auditRetentionDays: '1.5' }).auditRetentionDays).toBe(message);
    expect(errorsFor({ auditRetentionDays: '3651' }).auditRetentionDays).toBe(message);
    expect(errorsFor({ auditRetentionDays: 'ten' }).auditRetentionDays).toBe(message);
  });
});

describe('isTimezone', () => {
  it('accepts UTC and canonical zones the ICU list leaves out, and rejects made-up ones', () => {
    expect(isTimezone('UTC')).toBe(true);
    expect(isTimezone('Asia/Kolkata')).toBe(true);
    expect(isTimezone('Mars/Olympus')).toBe(false);
  });
});

describe('toAppSettingsValues', () => {
  it('keeps the form fields, writes the retention as text and copies the language list', () => {
    const row = appSettings({ auditRetentionDays: 90 });
    const values = toAppSettingsValues(row);
    expect(values).toEqual({
      dateFormat: 'dd MMM yyyy',
      timeFormat: 'HH:mm',
      timezone: 'UTC',
      defaultLocale: 'en',
      enabledLocales: ['hi'],
      autoTranslate: true,
      auditRetentionDays: '90',
    });
    expect(values.enabledLocales).not.toBe(row.enabledLocales);
  });

  it('canonicalises the stored default language, and falls back to English when there is none', () => {
    expect(toAppSettingsValues(appSettings({ defaultLocale: 'pt_br' })).defaultLocale).toBe(
      'pt-BR',
    );
    expect(toAppSettingsValues(appSettings({ defaultLocale: '' })).defaultLocale).toBe('en');
  });
});
