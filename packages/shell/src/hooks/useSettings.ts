import { useFormatters, useI18n } from '@exyconn/i18n';
import { useAppSettingsQuery } from '@/graphql/generated';

/** What every screen renders with before the workspace's own settings have loaded. */
const FALLBACK = {
  dateFormat: 'dd MMM yyyy',
  timeFormat: 'hh:mm a',
  timezone: 'UTC',
  defaultLocale: 'en',
  enabledLocales: ['en'],
  autoTranslate: true,
};

/**
 * The admin-configured formats and the helpers that apply them, so dates, numbers and money
 * are never hand-formatted across the app (CLAUDE.md rule 11).
 *
 * The formatting itself now comes from `@exyconn/i18n`, which means two things every caller
 * gets for free: a timestamp is rendered in the reader's own timezone rather than the
 * browser's — the old `date-fns/format` ignored the configured zone entirely — and numbers,
 * money and relative times are written in their own language's notation.
 */
export function useSettings() {
  const { data } = useAppSettingsQuery({ fetchPolicy: 'cache-first' });
  const settings = data?.appSettings ?? FALLBACK;
  const { locale, direction } = useI18n();
  const formatters = useFormatters();

  return { settings, locale, direction, ...formatters };
}
