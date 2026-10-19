import { useCallback } from 'react';
import { useFormatters, useI18n, useT } from '@exyconn/i18n';
import { CrmDashboardGranularity } from '@exyconn/shell/graphql/generated';

/** One period as the server keys it: 2026-10-19, 2026-W42 or 2026-10, and when it starts. */
interface PeriodPoint {
  key: string;
  start: string;
}

/**
 * How a chart's periods read: a day in the admin-configured date format, a week by its ISO
 * number, a month by its name in the reader's language — all in the company's zone.
 */
export function usePeriodLabels(granularity: CrmDashboardGranularity, timezone: string) {
  const t = useT();
  const { locale } = useI18n();
  const { formatDate } = useFormatters();
  return useCallback(
    (point: PeriodPoint): string => {
      if (granularity === CrmDashboardGranularity.Day) {
        return formatDate(point.start);
      }
      if (granularity === CrmDashboardGranularity.Week) {
        const [year, week] = point.key.split('-W');
        return t('Week {week}, {year}', { week: Number(week), year });
      }
      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        year: 'numeric',
        timeZone: timezone,
      }).format(new Date(point.start));
    },
    [formatDate, granularity, locale, t, timezone],
  );
}
