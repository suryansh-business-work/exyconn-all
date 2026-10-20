import type { SelectOption } from '@/components/form/rhf/types';
import { MODULES } from '@/config/modules';

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

/** Headcount bands, as most registers ask for them. */
export const COMPANY_SIZE_OPTIONS: SelectOption[] = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
].map((band) => ({ value: band, label: band }));

/**
 * The portals somebody can be invited to, one per role — each portal is opened by exactly
 * one role, so ticking a portal grants that role.
 */
export const PORTAL_OPTIONS: SelectOption[] = MODULES.map((module) => ({
  value: module.role,
  label: module.label,
})).filter((option, index, all) => all.findIndex((o) => o.value === option.value) === index);
