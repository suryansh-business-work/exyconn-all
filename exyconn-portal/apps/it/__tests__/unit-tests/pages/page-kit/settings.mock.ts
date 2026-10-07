/**
 * A stand-in for `@exyconn/shell/hooks/useSettings` with formatters whose output names what
 * they were given, so a test can see which value was formatted and how, without depending
 * on the workspace's date format or the machine's timezone.
 */
export const settingsModule = {
  useSettings: () => ({
    formatDate: (value: string) => `date(${value})`,
    formatDateTime: (value: string) => `datetime(${value})`,
    formatCurrency: (value: number) => `money(${value})`,
  }),
};
