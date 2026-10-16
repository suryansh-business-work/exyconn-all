import { useMemo } from 'react';
import { formatDate, formatDateTime, formatTime, useI18n } from '@exyconn/i18n';

/** The visitor's own time zone, which every time on the booking page is shown in. */
export const visitorZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The portal's date and time formats, in the visitor's zone rather than the host's. */
export function useVisitorTime() {
  const { settings } = useI18n();
  return useMemo(() => {
    const local = { ...settings, timezone: visitorZone() };
    return {
      zone: local.timezone,
      time: (at: string | Date) => formatTime(at, local),
      date: (at: string | Date) => formatDate(at, local),
      dateTime: (at: string | Date) => formatDateTime(at, local),
      /** The visitor's calendar day of a moment, as a sortable key. */
      dayKey: (at: string | Date) => formatDate(at, { ...local, dateFormat: 'yyyy-MM-dd' }),
    };
  }, [settings]);
}
