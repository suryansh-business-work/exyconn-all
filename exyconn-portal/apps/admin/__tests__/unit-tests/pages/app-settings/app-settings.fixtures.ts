import { TaxSystem, type AppSettingsQuery } from '@exyconn/shell/graphql/generated';

type AppSettingsRow = AppSettingsQuery['appSettings'];

export const appSettings = (overrides: Partial<AppSettingsRow> = {}): AppSettingsRow => ({
  __typename: 'AppSettings',
  id: 'settings-1',
  dateFormat: 'dd MMM yyyy',
  timeFormat: 'HH:mm',
  timezone: 'UTC',
  defaultLocale: 'en',
  enabledLocales: ['hi'],
  autoTranslate: true,
  auditRetentionDays: 0,
  currency: 'INR',
  country: 'IN',
  fiscalYearStartMonth: 4,
  taxSystem: Object.values(TaxSystem)[0],
  ...overrides,
});
