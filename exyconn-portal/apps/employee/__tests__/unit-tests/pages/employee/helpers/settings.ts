/**
 * Module stand-in for `@exyconn/shell/hooks/useSettings`. The real hook formats in the
 * reader's zone and locale; these mark each value with how it was formatted, so a test can
 * tell which formatter a column used without depending on the machine's timezone.
 */
type Formattable = string | Date | null | undefined;

const formatAs = (prefix: string) => (value: Formattable) => {
  if (!value) return '';
  const text = value instanceof Date ? value.toISOString() : value;
  return `${prefix} ${text}`;
};

const SETTINGS = {
  settings: {
    dateFormat: 'dd MMM yyyy',
    timeFormat: 'hh:mm a',
    timezone: 'Asia/Kolkata',
    defaultLocale: 'en',
    enabledLocales: ['en'],
    autoTranslate: true,
  },
  locale: 'en',
  direction: 'ltr',
  formatDate: formatAs('on'),
  formatDateTime: formatAs('at'),
  formatTime: formatAs('time'),
};

export function useSettings() {
  return SETTINGS;
}
