import type { MockLink } from '@apollo/client/testing';
import { AppSettingsDocument, TaxSystem } from '@/graphql/generated';

/** The workspace settings as the server returns them, with the time format a test needs. */
export function appSettingsMock(timeFormat: string): MockLink.MockedResponse {
  return {
    request: { query: AppSettingsDocument },
    result: {
      data: {
        appSettings: {
          __typename: 'AppSettings',
          id: 'settings-1',
          dateFormat: 'dd MMM yyyy',
          timeFormat,
          timezone: 'UTC',
          defaultLocale: 'en',
          enabledLocales: ['en'],
          autoTranslate: false,
          auditRetentionDays: 365,
          currency: 'INR',
          country: 'IN',
          fiscalYearStartMonth: 4,
          taxSystem: TaxSystem.None,
        },
      },
    },
    maxUsageCount: 10,
  };
}
