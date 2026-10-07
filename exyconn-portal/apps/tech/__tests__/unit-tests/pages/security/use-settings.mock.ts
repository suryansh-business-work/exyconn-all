import { vi } from 'vitest';

/**
 * Formatters that show what they were handed, so a test can tell which value a screen formats
 * and with which helper, without depending on the admin-configured timezone or locale.
 */
export const formatters = {
  formatDate: (value: string) => `date(${value})`,
  formatDateTime: (value: string) => `at(${value})`,
  formatNumber: (value: number) => `#${value}`,
  formatPercent: vi.fn((value: number) => `${value}%`),
};

/** The `@exyconn/shell/hooks/useSettings` module with the formatters above in place. */
export function settingsModule() {
  return { useSettings: () => formatters };
}
