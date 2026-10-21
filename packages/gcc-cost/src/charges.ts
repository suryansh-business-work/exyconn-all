/** Where a charge is reported. Payroll and recruitment come from roles; the rest from inputs. */
export const COST_SECTIONS = [
  'payroll',
  'recruitment',
  'office',
  'technology',
  'legal',
  'hr',
  'admin',
  'services',
] as const;
export type CostSection = (typeof COST_SECTIONS)[number];

/**
 * - `setup`: one-time spend (fit-out, incorporation, a laptop for a new seat). Charged once, in
 *   the month it falls due — never spread across the forecast.
 * - `operating`: recurring running cost.
 * - `deposit`: refundable security deposits. Cash out, but not an expense: kept out of every
 *   cost total and reported only in the initial cash requirement.
 */
export type ChargeKind = 'setup' | 'operating' | 'deposit';

/** One amount, due in one month, from one input. Amounts are pre-tax INR paise. */
export interface Charge {
  /** The id of the line, role, subscription or usage row it came from. */
  sourceId: string;
  section: CostSection;
  /** Category label for lines; department for payroll and recruitment. */
  group: string;
  label: string;
  month: number;
  kind: ChargeKind;
  amount: number;
  tax: number;
  /** Optional add-ons are reported apart from the main totals. */
  optional: boolean;
  /** Marked "requires professional review": counted, and listed as uncertain. */
  review: boolean;
  /** From an illustrative default rather than the user or a verified source. */
  illustrative: boolean;
}

export type ChargeMeta = Pick<
  Charge,
  'sourceId' | 'section' | 'group' | 'label' | 'optional' | 'review' | 'illustrative'
>;

/** Builds a charge, dropping zero amounts so reports do not list empty rows. */
export function charge(
  meta: ChargeMeta,
  month: number,
  kind: ChargeKind,
  amount: number,
  tax = 0,
): Charge[] {
  if (amount === 0 && tax === 0) {
    return [];
  }
  return [{ ...meta, month, kind, amount, tax }];
}

export const plainMeta = (
  sourceId: string,
  section: CostSection,
  group: string,
  label: string,
  illustrative = false,
): ChargeMeta => ({
  sourceId,
  section,
  group,
  label,
  optional: false,
  review: false,
  illustrative,
});

/** 1-based months of the full projection. */
export function monthRange(from: number, to: number): number[] {
  const months: number[] = [];
  for (let month = from; month <= to; month += 1) {
    months.push(month);
  }
  return months;
}

/** Compound growth applied on each anniversary of `start` (year 0 is unescalated). */
export function escalation(pct: number, month: number, start = 1): number {
  const years = Math.floor((month - start) / 12);
  return years > 0 ? (1 + pct / 100) ** years : 1;
}
