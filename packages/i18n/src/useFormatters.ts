import { useMemo } from 'react';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatList,
  formatNumber,
  formatPercent,
  formatRelative,
  formatTime,
} from './format';
import { useI18n } from './I18nProvider';

type DateInput = string | number | Date | null | undefined;

/**
 * The formatters, already bound to the person's locale and zone.
 *
 * A screen never passes settings around: it asks for the formatter it needs and the answer
 * is already in the right language, the right notation and the right timezone.
 */
export function useFormatters() {
  const { settings } = useI18n();
  return useMemo(
    () => ({
      formatDate: (value: DateInput) => formatDate(value, settings),
      formatDateTime: (value: DateInput) => formatDateTime(value, settings),
      formatTime: (value: DateInput) => formatTime(value, settings),
      formatRelative: (value: DateInput) => formatRelative(value, settings),
      formatNumber: (value: number | null | undefined, options?: Intl.NumberFormatOptions) =>
        formatNumber(value, settings, options),
      formatCurrency: (value: number | null | undefined, options?: Intl.NumberFormatOptions) =>
        formatCurrency(value, settings, options),
      formatPercent: (value: number | null | undefined, options?: Intl.NumberFormatOptions) =>
        formatPercent(value, settings, options),
      formatList: (items: string[]) => formatList(items, settings),
    }),
    [settings],
  );
}
