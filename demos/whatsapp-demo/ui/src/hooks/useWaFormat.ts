import { useMemo } from 'react';
import { useFormatters, useI18n } from '@exyconn/i18n';
import type { Formatters } from '@exyconn/wa-flow/engine';

/** Demo prices are written in rupees, whatever currency the company books in. */
const DEMO_CURRENCY = 'INR';

/**
 * The formatters the chat and the engine share: the viewer's admin-configured date and time
 * patterns and timezone, plus a short weekday-and-date for slot pickers in their own locale.
 */
export function useWaFormat(): Formatters {
  const f = useFormatters();
  const { settings } = useI18n();
  return useMemo(() => {
    const day = new Intl.DateTimeFormat(settings.locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: settings.timezone,
    });
    return {
      date: (ms) => f.formatDate(ms),
      time: (ms) => f.formatTime(ms),
      day: (ms) => day.format(ms),
      money: (rupees) =>
        f.formatCurrency(rupees, { currency: DEMO_CURRENCY, maximumFractionDigits: 0 }),
    };
  }, [f, settings.locale, settings.timezone]);
}
