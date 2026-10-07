/**
 * A stand-in for the shell's `useSettings`, so dates render as a predictable string instead
 * of depending on the clock, the timezone and the workspace settings query.
 * Used as `vi.mock('@exyconn/shell/hooks/useSettings', () => settingsMock)`.
 */
export const settingsMock = {
  useSettings: () => ({
    formatRelative: (value: string) => `relative(${value})`,
    formatDate: (value: string) => `date(${value})`,
  }),
};
