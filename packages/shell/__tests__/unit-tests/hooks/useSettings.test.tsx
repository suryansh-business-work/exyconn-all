import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@exyconn/i18n';
import { useAppSettingsQuery } from '@/graphql/generated';
import { useSettings } from '@/hooks/useSettings';

vi.mock('@/graphql/generated', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/graphql/generated')>()),
  useAppSettingsQuery: vi.fn(),
}));

type QueryResult = ReturnType<typeof useAppSettingsQuery>;

function setup(data: QueryResult['data'], locale = 'en') {
  vi.mocked(useAppSettingsQuery).mockReturnValue({ data } as QueryResult);
  return renderHook(() => useSettings(), {
    wrapper: ({ children }: Readonly<{ children: ReactNode }>) => (
      <I18nProvider locale={locale} messages={{}} settings={{ timezone: 'UTC', currency: 'USD' }}>
        {children}
      </I18nProvider>
    ),
  }).result.current;
}

describe('useSettings', () => {
  it('reads the settings from the cache first', () => {
    setup(undefined);
    expect(useAppSettingsQuery).toHaveBeenCalledWith({ fetchPolicy: 'cache-first' });
  });

  it('renders with the built-in defaults before the workspace settings load', () => {
    const { settings } = setup(undefined);
    expect(settings).toEqual({
      dateFormat: 'dd MMM yyyy',
      timeFormat: 'hh:mm a',
      timezone: 'UTC',
      defaultLocale: 'en',
      enabledLocales: ['en'],
      autoTranslate: true,
    });
  });

  it("uses the workspace's own settings once they load", () => {
    const appSettings = { dateFormat: 'yyyy-MM-dd', timeFormat: 'HH:mm', timezone: 'Asia/Kolkata' };
    const { settings } = setup({ appSettings } as QueryResult['data']);
    expect(settings).toBe(appSettings);
  });

  it('carries the locale, direction and formatters of the current language', () => {
    const result = setup(undefined, 'ar');
    expect(result.locale).toBe('ar');
    expect(result.direction).toBe('rtl');
    expect(result.formatCurrency(12)).toMatch(/12/);
    expect(result.formatList(['a', 'b'])).toContain('a');
  });
});
