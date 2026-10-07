/** The viewer's date formatter, as `useSettings` would hand it over. */
export const formatDate = (value: string) => `on ${value}`;

/** `@exyconn/shell/hooks/useSettings` with a fixed, recognisable formatter. */
export function settingsModuleMock() {
  return { useSettings: () => ({ formatDate }) };
}
