/** The viewer's date formatter, as `useSettings` would hand it over. */
export const formatDate = (value: string) => `on ${value}`;

/** The viewer's date-and-time formatter, as `useSettings` would hand it over. */
export const formatDateTime = (value: string | null | undefined) => `at ${value ?? 'no time'}`;

/** `@exyconn/shell/hooks/useSettings` with fixed, recognisable formatters. */
export function settingsModuleMock() {
  return { useSettings: () => ({ formatDate, formatDateTime }) };
}
