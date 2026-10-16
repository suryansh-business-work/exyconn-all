import { useMemo } from 'react';
import { formatDate, formatTime, useI18n } from '@exyconn/i18n';

/** The visitor's own time zone, which the booking page starts in. */
export const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The portal's date and time formats, in the zone the visitor picked. */
export function useBookingTime(zone: string) {
  const { settings } = useI18n();
  return useMemo(() => {
    const local = { ...settings, timezone: zone };
    return {
      time: (at: string | Date) => formatTime(at, local),
      date: (at: string | Date) => formatDate(at, local),
      /** The calendar day of a moment in the chosen zone, as a sortable key. */
      dayKey: (at: string | Date) => formatDate(at, { ...local, dateFormat: 'yyyy-MM-dd' }),
      /** The weekday and date of a day the calendar picked, in the visitor's language. */
      dayTitle: (at: Date) =>
        new Intl.DateTimeFormat(settings.locale, {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(at),
    };
  }, [settings, zone]);
}
