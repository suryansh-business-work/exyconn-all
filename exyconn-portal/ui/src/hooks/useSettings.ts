import { useCallback } from 'react';
import { useAppSettingsQuery } from '../graphql/generated';
import { formatWith } from '../utils/date';

const FALLBACK = { dateFormat: 'dd MMM yyyy', timeFormat: 'hh:mm a', timezone: 'Asia/Kolkata' };

/**
 * Exposes the admin-configured date/time formats and helpers that apply them, so
 * dates are never hardcoded across the app (CLAUDE.md rule 11).
 */
export function useSettings() {
  const { data } = useAppSettingsQuery({ fetchPolicy: 'cache-first' });
  const settings = data?.appSettings ?? FALLBACK;

  const formatDate = useCallback(
    (value: string | Date | null | undefined) => formatWith(value, settings.dateFormat),
    [settings.dateFormat],
  );

  const formatDateTime = useCallback(
    (value: string | Date | null | undefined) =>
      formatWith(value, `${settings.dateFormat} ${settings.timeFormat}`),
    [settings.dateFormat, settings.timeFormat],
  );

  return { settings, formatDate, formatDateTime };
}
