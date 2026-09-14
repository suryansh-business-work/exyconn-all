import type { SelectOption } from '@exyconn/shell/components/form/rhf/types';

/** The twelve months, named by the runtime rather than spelled out here. */
export const MONTH_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_unused, index) => ({
  value: String(index + 1),
  label: new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(2026, index, 1)),
}));

/** What a company's invoices and payroll follow. */
export const TAX_SYSTEM_OPTIONS: SelectOption[] = [
  { value: 'NONE', label: 'No tax lines' },
  { value: 'VAT', label: 'VAT / sales tax (one rate)' },
  { value: 'INDIA_GST', label: 'India — GST, PF, ESI and income-tax slabs' },
];
