import type { SelectOption } from '@exyconn/shell/components/form/rhf/types';

/** The twelve months, named by the runtime rather than spelled out here. */
export const MONTH_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_unused, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(2026, index, 1)),
}));
