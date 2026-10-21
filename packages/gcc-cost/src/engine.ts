import { monthRange, type Charge } from './charges';
import { planHeadcount, type HeadcountPlan } from './headcount';
import { LIMITS } from './limits';
import { categoryLabels, isActive, lineCharges, percentageCharges } from './lines';
import { BASE_CURRENCY, inrPerUnit, percentOf } from './money';
import { officeCharges } from './office';
import { payrollCharges } from './payroll';
import type { FxRate, Scenario } from './schema';
import {
  budgetCharges,
  hardwareCharges,
  subscriptionCharges,
  usageCharges,
  type RateOf,
} from './technology';

/** Something the result cannot account for; the UI shows it next to the totals. */
export interface CalculationIssue {
  code: 'missing-rate';
  sourceId: string;
  currency: string;
}

/** One month of the projection. Main totals exclude optional add-ons; deposits stand apart. */
export interface MonthTotals {
  month: number;
  headcount: number;
  hires: number;
  setup: number;
  operating: number;
  tax: number;
  /** The part of `tax` charged on operating costs (the rest is on setup). */
  operatingTax: number;
  /** Contingency on the month's pre-tax setup and operating cost. */
  contingency: number;
  /** setup + operating + tax + contingency. Excludes deposits. */
  total: number;
  deposits: number;
  optional: number;
}

export interface ScenarioResult {
  scenario: Scenario;
  plan: HeadcountPlan;
  charges: Charge[];
  months: MonthTotals[];
  issues: CalculationIssue[];
}

/**
 * Runs one input's producer. An input priced in a currency the estimate has no rate for
 * becomes an issue instead of an amount, so the result says what it leaves out.
 */
function collect(
  input: { sourceId: string; currency: string },
  context: { rates: readonly FxRate[]; issues: CalculationIssue[] },
  produce: () => Charge[],
): Charge[] {
  const { sourceId, currency } = input;
  const known =
    currency === BASE_CURRENCY || context.rates.some((rate) => rate.currency === currency);
  if (!known) {
    context.issues.push({ code: 'missing-rate', sourceId, currency });
    return [];
  }
  return produce();
}

interface Context {
  rates: readonly FxRate[];
  issues: CalculationIssue[];
  rateOf: RateOf;
}

function technology(scenario: Scenario, plan: HeadcountPlan, context: Context): Charge[] {
  const { ai, assumptions } = scenario;
  const { rateOf } = context;
  const variable =
    ai.mode === 'budget'
      ? collect({ sourceId: 'ai-budget', currency: ai.budgetCurrency }, context, () =>
          budgetCharges(ai, rateOf, assumptions),
        )
      : ai.usage.flatMap((usage) =>
          collect({ sourceId: usage.id, currency: usage.currency }, context, () =>
            usageCharges(usage, rateOf, assumptions),
          ),
        );
  const subscriptions = ai.subscriptions.flatMap((subscription) =>
    collect({ sourceId: subscription.id, currency: subscription.currency }, context, () =>
      subscriptionCharges(subscription, rateOf, assumptions),
    ),
  );
  return [...subscriptions, ...variable, ...hardwareCharges(ai, plan, assumptions)];
}

export function monthTotals(
  charges: readonly Charge[],
  plan: HeadcountPlan,
  contingencyPct: number,
): MonthTotals[] {
  const months = monthRange(1, LIMITS.months).map((month) => ({
    month,
    headcount: plan.active[month - 1],
    hires: plan.hires[month - 1],
    setup: 0,
    operating: 0,
    tax: 0,
    operatingTax: 0,
    contingency: 0,
    total: 0,
    deposits: 0,
    optional: 0,
  }));
  for (const item of charges) {
    const row = months[item.month - 1];
    if (item.optional) {
      row.optional += item.amount + item.tax;
    } else if (item.kind === 'deposit') {
      row.deposits += item.amount;
    } else {
      row[item.kind] += item.amount;
      row.tax += item.tax;
      if (item.kind === 'operating') {
        row.operatingTax += item.tax;
      }
    }
  }
  for (const row of months) {
    row.contingency = percentOf(row.setup + row.operating, contingencyPct);
    row.total = row.setup + row.operating + row.tax + row.contingency;
  }
  return months;
}

/**
 * Every charge of a scenario for the full 60-month projection, and the monthly totals. The
 * forecast window the user picks is a view over this (see summary.ts), so switching between
 * 12, 24, 36 and 60 months never changes an amount.
 */
export function calculateScenario(scenario: Scenario, fxRates: readonly FxRate[]): ScenarioResult {
  const context: Context = {
    rates: fxRates,
    issues: [],
    rateOf: (currency) => inrPerUnit(currency, fxRates),
  };
  const plan = planHeadcount(scenario.roles, scenario.assumptions);
  const categories = categoryLabels(scenario.categories);
  const lines = scenario.lines.filter(isActive);
  const direct = [
    ...payrollCharges(plan.roles, scenario.assumptions),
    ...officeCharges(scenario.office, scenario.assumptions),
    ...technology(scenario, plan, context),
    ...lines
      .filter((line) => line.pricing !== 'percentage')
      .flatMap((line) =>
        collect({ sourceId: line.id, currency: line.currency }, context, () =>
          lineCharges(line, plan, context.rateOf, categories),
        ),
      ),
  ];
  const percentages = lines
    .filter((line) => line.pricing === 'percentage')
    .flatMap((line) => percentageCharges(line, direct, categories));
  const charges = [...direct, ...percentages];
  return {
    scenario,
    plan,
    charges,
    months: monthTotals(charges, plan, scenario.assumptions.contingencyPct),
    issues: context.issues,
  };
}
