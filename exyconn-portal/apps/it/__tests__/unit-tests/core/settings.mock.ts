/** The viewer's formatters, as `useSettings` would hand them over — recognisable in output. */
export const formatDate = (value: string) => `on ${value}`;
export const formatDateTime = (value: string) => `at ${value}`;
export const formatCurrency = (value: number) => `INR ${value}`;

/** Factory for `vi.mock('@exyconn/shell/hooks/useSettings', …)`. */
export function settingsModuleMock() {
  return { useSettings: () => ({ formatDate, formatDateTime, formatCurrency }) };
}
