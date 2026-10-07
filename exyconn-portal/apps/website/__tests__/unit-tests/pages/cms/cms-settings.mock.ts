/** The viewer's date formatter, as `useSettings` hands it over. */
export const formatDate = (value: string) => `on ${value}`;

/** The viewer's date-and-time formatter, as `useSettings` hands it over. */
export const formatDateTime = (value: string) => `at ${value}`;

/**
 * `@exyconn/shell/hooks/useSettings` with fixed, recognisable formatters. Dependency-free on
 * purpose: a `vi.mock` factory imports it while the module graph is still loading.
 */
export function settingsModuleMock() {
  return { useSettings: () => ({ formatDate, formatDateTime }) };
}
