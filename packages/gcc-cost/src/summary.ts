import type { Charge, CostSection } from './charges';
import type { MonthTotals, ScenarioResult } from './engine';
import { FORECAST_MONTHS } from './schema';
import { sumMinor } from './money';

export interface GroupTotal {
  key: string;
  section: CostSection;
  group: string;
  /** The item label for item totals; the group again for group totals. */
  label: string;
  setup: number;
  operating: number;
  tax: number;
  /** setup + operating + tax (contingency is reported once, not per group). */
  total: number;
}

export interface ScenarioSummary {
  forecastMonths: number;
  /** One-time costs inside the forecast window, pre-tax. */
  setupCost: number;
  /** Refundable deposits paid inside the window. Never part of a cost total. */
  deposits: number;
  /**
   * Month-1 setup with its tax, month-1 deposits, the working-capital reserve (months × the
   * first year's average monthly operating cost with its tax), and month-1 operating cost with
   * its tax when paid in advance.
   */
  initialCash: number;
  workingCapital: number;
  phaseMonth: number;
  /** Pre-tax operating cost of the phase month. */
  monthlyOperating: number;
  phaseHeadcount: number;
  /** monthlyOperating ÷ headcount in the phase month; null with nobody on payroll. */
  costPerEmployeeMonthly: number | null;
  /** Pre-tax operating cost of each forecast year (12-month blocks inside the window). */
  annualOperating: number[];
  tax: number;
  contingency: number;
  /** Every cost in the window: setup + operating + tax + contingency. Excludes deposits. */
  forecastTotal: number;
  /** Cumulative total at 12, 24, 36 and 60 months, whatever the window. */
  horizonTotals: { months: number; total: number }[];
  optionalTotal: number;
  /** Present value of the monthly totals at the discount rate; null without a rate. */
  presentValue: number | null;
  /** First month whose cumulative benefit covers cumulative cost; null when not reached or no benefit was given. */
  breakEvenMonth: number | null;
  byGroup: GroupTotal[];
  byItem: GroupTotal[];
  reviewItems: string[];
  illustrativeItems: string[];
}

const within = (months: readonly MonthTotals[], window: number) =>
  months.filter((row) => row.month <= window);

const sumField = (rows: readonly MonthTotals[], field: keyof Omit<MonthTotals, 'month'>) =>
  sumMinor(rows.map((row) => row[field]));

function aggregate(charges: readonly Charge[], window: number, byItem: boolean): GroupTotal[] {
  const groups = new Map<string, GroupTotal>();
  for (const item of charges) {
    if (item.month > window || item.optional || item.kind === 'deposit') {
      continue;
    }
    const label = byItem ? item.label : item.group;
    const key = [item.section, item.group, byItem ? item.sourceId : '', label].join(':');
    const group = groups.get(key) ?? {
      key,
      section: item.section,
      group: item.group,
      label,
      setup: 0,
      operating: 0,
      tax: 0,
      total: 0,
    };
    group[item.kind] += item.amount;
    group.tax += item.tax;
    group.total += item.amount + item.tax;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total);
}

/** Pre-deposit, non-optional totals per section and group inside the window. */
export const groupTotals = (charges: readonly Charge[], window: number) =>
  aggregate(charges, window, false);

/** The same, per individual input (a role's salaries, one cost line, one subscription). */
export const itemTotals = (charges: readonly Charge[], window: number) =>
  aggregate(charges, window, true);

const uniqueLabels = (charges: readonly Charge[], pick: (item: Charge) => boolean) =>
  [...new Set(charges.filter(pick).map((item) => item.label))].sort((a, b) => a.localeCompare(b));

function presentValue(rows: readonly MonthTotals[], ratePct: number | null): number | null {
  if (ratePct === null) {
    return null;
  }
  return Math.round(
    rows.reduce((total, row) => total + row.total / (1 + ratePct / 100) ** (row.month / 12), 0),
  );
}

/** Break-even only exists when the user supplied a monthly benefit (savings or revenue). */
function breakEven(rows: readonly MonthTotals[], monthlyBenefit: number | null): number | null {
  if (monthlyBenefit === null) {
    return null;
  }
  let cumulative = 0;
  for (const row of rows) {
    cumulative += Math.round(monthlyBenefit * 100) - row.total;
    if (cumulative >= 0) {
      return row.month;
    }
  }
  return null;
}

export function summarise(result: ScenarioResult): ScenarioSummary {
  const { assumptions } = result.scenario;
  const window = assumptions.forecastMonths;
  const rows = within(result.months, window);
  const first = result.months[0];
  const phaseMonth = Math.min(assumptions.operatingPhaseMonth, window);
  const phase = result.months[phaseMonth - 1];
  const firstYear = within(result.months, 12);
  const averageMonthly =
    (sumField(firstYear, 'operating') + sumField(firstYear, 'operatingTax')) / 12;
  const workingCapital = Math.round(averageMonthly * assumptions.workingCapitalMonths);
  const advance =
    assumptions.paymentTiming === 'advance' ? first.operating + first.operatingTax : 0;
  const headcount = phase.headcount;
  return {
    forecastMonths: window,
    setupCost: sumField(rows, 'setup'),
    deposits: sumField(rows, 'deposits'),
    initialCash: first.setup + first.tax + first.deposits + workingCapital + advance,
    workingCapital,
    phaseMonth,
    monthlyOperating: phase.operating,
    phaseHeadcount: headcount,
    costPerEmployeeMonthly: headcount > 0 ? Math.round(phase.operating / headcount) : null,
    annualOperating: Array.from({ length: window / 12 }, (_, year) =>
      sumField(rows.slice(year * 12, year * 12 + 12), 'operating'),
    ),
    tax: sumField(rows, 'tax'),
    contingency: sumField(rows, 'contingency'),
    forecastTotal: sumField(rows, 'total'),
    horizonTotals: FORECAST_MONTHS.map((months) => ({
      months,
      total: sumField(within(result.months, months), 'total'),
    })),
    optionalTotal: sumField(rows, 'optional'),
    presentValue: presentValue(rows, assumptions.discountRatePct),
    breakEvenMonth: breakEven(rows, assumptions.monthlyBenefit),
    byGroup: groupTotals(result.charges, window),
    byItem: itemTotals(result.charges, window),
    reviewItems: uniqueLabels(result.charges, (item) => item.review && item.month <= window),
    illustrativeItems: uniqueLabels(
      result.charges,
      (item) => item.illustrative && item.month <= window,
    ),
  };
}

/** Totals per department (payroll and recruitment) inside the window. */
export function departmentTotals(summary: ScenarioSummary): GroupTotal[] {
  const departments = new Map<string, GroupTotal>();
  for (const group of summary.byGroup) {
    if (group.section !== 'payroll' && group.section !== 'recruitment') {
      continue;
    }
    const current = departments.get(group.group);
    departments.set(
      group.group,
      current
        ? {
            ...current,
            operating: current.operating + group.operating,
            total: current.total + group.total,
          }
        : { ...group, key: group.group, label: group.group },
    );
  }
  return [...departments.values()].sort((a, b) => b.total - a.total);
}
