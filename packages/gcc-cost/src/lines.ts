import {
  charge,
  escalation,
  monthRange,
  type Charge,
  type ChargeMeta,
  type CostSection,
} from './charges';
import type { HeadcountPlan } from './headcount';
import { LIMITS } from './limits';
import { percentOf, toMinor } from './money';
import type { Category, CostLine } from './schema';
import type { RateOf } from './technology';

/**
 * Generic cost lines (legal, HR, admin, services, extra office and technology items). The rule
 * system is fixed and declarative — no user formula is ever evaluated:
 *
 * - `flat`: quantity × unit price, on each occurrence of the frequency.
 * - `per-employee`: quantity × unit price × people on payroll that month.
 * - `per-hire`: quantity × unit price × hires that month (new positions and backfills); billed
 *   in the month of the hire whatever the frequency says.
 * - `percentage`: the rate × that month's pre-tax operating cost of the chosen base. Evaluated
 *   monthly, after every other charge, and never on another percentage line.
 *
 * Escalation compounds on each anniversary of the line's start month (not for percentages, whose
 * base escalates already). A setup fee is charged once, in the start month. Disabled lines and
 * lines marked not applicable produce nothing.
 */
const MONTHS = monthRange(1, LIMITS.months);
const STEP = { monthly: 1, quarterly: 3, annual: 12 } as const;

export function isActive(line: CostLine): boolean {
  return line.enabled && line.applicability !== 'not-applicable';
}

export function occurrences(line: CostLine): number[] {
  const end = line.endMonth ?? LIMITS.months;
  if (line.frequency === 'one-time') {
    return [line.startMonth];
  }
  const step = line.pricing === 'per-hire' ? 1 : STEP[line.frequency];
  return MONTHS.filter((month) => month >= line.startMonth && month <= end).filter(
    (month) => (month - line.startMonth) % step === 0,
  );
}

function lineMeta(line: CostLine, categories: ReadonlyMap<string, string>): ChargeMeta {
  return {
    sourceId: line.id,
    section: line.section,
    group: categories.get(line.categoryId) ?? line.section,
    label: line.label,
    optional: line.optional,
    review: line.applicability === 'review',
    illustrative: line.source.kind === 'illustrative',
  };
}

function driver(line: CostLine, plan: HeadcountPlan, month: number): number {
  if (line.pricing === 'per-employee') {
    return plan.active[month - 1];
  }
  if (line.pricing === 'per-hire') {
    return plan.hires[month - 1];
  }
  return 1;
}

/** Charges of a non-percentage line. */
export function lineCharges(
  line: CostLine,
  plan: HeadcountPlan,
  rateOf: RateOf,
  categories: ReadonlyMap<string, string>,
): Charge[] {
  const meta = lineMeta(line, categories);
  const rate = rateOf(line.currency);
  const kind = line.frequency === 'one-time' ? 'setup' : 'operating';
  const setupFee = toMinor(line.setupFee * rate);
  const recurring = occurrences(line).flatMap((month) => {
    const rupees =
      line.quantity *
      line.unitPrice *
      rate *
      driver(line, plan, month) *
      escalation(line.escalationPct, month, line.startMonth);
    const amount = toMinor(rupees);
    return charge(meta, month, kind, amount, percentOf(amount, line.taxRatePct));
  });
  return [
    ...charge(
      { ...meta, label: `${line.label} (setup fee)` },
      line.startMonth,
      'setup',
      setupFee,
      percentOf(setupFee, line.taxRatePct),
    ),
    ...recurring,
  ];
}

const BASE_SECTIONS: Record<CostLine['percentBase'], ReadonlySet<CostSection> | null> = {
  payroll: new Set(['payroll']),
  office: new Set(['office']),
  technology: new Set(['technology']),
  operating: null,
};

/** Pre-tax, non-optional operating cost per month of the charges a percentage line may use. */
export function operatingBase(charges: readonly Charge[], base: CostLine['percentBase']): number[] {
  const sections = BASE_SECTIONS[base];
  const totals = MONTHS.map(() => 0);
  charges
    .filter((item) => item.kind === 'operating' && !item.optional)
    .filter((item) => sections === null || sections.has(item.section))
    .forEach((item) => {
      totals[item.month - 1] += item.amount;
    });
  return totals;
}

export function percentageCharges(
  line: CostLine,
  charges: readonly Charge[],
  categories: ReadonlyMap<string, string>,
): Charge[] {
  const meta = lineMeta(line, categories);
  const base = operatingBase(charges, line.percentBase);
  const end = line.endMonth ?? LIMITS.months;
  return MONTHS.filter((month) => month >= line.startMonth && month <= end).flatMap((month) => {
    const amount = percentOf(base[month - 1], line.ratePct);
    return charge(meta, month, 'operating', amount, percentOf(amount, line.taxRatePct));
  });
}

export const categoryLabels = (categories: readonly Category[]): ReadonlyMap<string, string> =>
  new Map(categories.map((category) => [category.id, category.label]));
