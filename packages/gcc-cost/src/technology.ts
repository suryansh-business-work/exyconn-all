import { charge, escalation, monthRange, plainMeta, type Charge } from './charges';
import type { HeadcountPlan } from './headcount';
import { LIMITS } from './limits';
import { percentOf, toMinor } from './money';
import type { AiInputs, Assumptions, Subscription, TokenUsage } from './schema';

/** Rupees per unit of a currency; throws MissingRateError for a currency without a rate. */
export type RateOf = (currency: string) => number;

const MONTHS = monthRange(1, LIMITS.months);

/**
 * The monthly API charge of one usage row, in the price list's currency. Prices are per million
 * tokens: cached input is billed at the cached price instead of the input price, output at the
 * output price, and the batch share of all of it gets the batch discount.
 */
export function tokenCostPerMonth(usage: TokenUsage): number {
  const uncached = usage.inputMTokMonthly - usage.cachedInputMTokMonthly;
  const list =
    uncached * usage.inputPerMTok +
    usage.cachedInputMTokMonthly * usage.cachedInputPerMTok +
    usage.outputMTokMonthly * usage.outputPerMTok;
  const discount = ((usage.batchSharePct / 100) * usage.batchDiscountPct) / 100;
  return list * (1 - discount);
}

function recurring(
  sourceId: string,
  label: string,
  start: number,
  rupeesPerMonth: number,
  assumptions: Assumptions,
): Charge[] {
  return MONTHS.filter((month) => month >= start).flatMap((month) => {
    const amount = toMinor(rupeesPerMonth * escalation(assumptions.techGrowthPct, month, start));
    return charge(
      plainMeta(sourceId, 'technology', 'AI and software', label),
      month,
      'operating',
      amount,
      percentOf(amount, assumptions.technologyTaxPct),
    );
  });
}

export function subscriptionCharges(
  subscription: Subscription,
  rateOf: RateOf,
  assumptions: Assumptions,
): Charge[] {
  const label = [subscription.provider, subscription.plan].filter(Boolean).join(' · ');
  const perMonth =
    subscription.users * subscription.pricePerUserMonthly * rateOf(subscription.currency);
  return recurring(subscription.id, label, subscription.startMonth, perMonth, assumptions);
}

export function usageCharges(
  usage: TokenUsage,
  rateOf: RateOf,
  assumptions: Assumptions,
): Charge[] {
  const perMonth = tokenCostPerMonth(usage) * rateOf(usage.currency);
  return recurring(
    usage.id,
    `${usage.provider} · ${usage.model}`,
    usage.startMonth,
    perMonth,
    assumptions,
  );
}

/** A fixed monthly AI and API budget, used instead of token usage when volumes are unknown. */
export function budgetCharges(ai: AiInputs, rateOf: RateOf, assumptions: Assumptions): Charge[] {
  const perMonth = ai.monthlyBudget * rateOf(ai.budgetCurrency);
  return recurring('ai-budget', 'AI and API budget', 1, perMonth, assumptions);
}

/** Devices reaching the end of a cycle in `month`: bought one, two, … cycles earlier. */
function devicesDue(newHires: readonly number[], month: number, cycle: number): number {
  let due = 0;
  for (let bought = month - cycle; bought >= 1; bought -= cycle) {
    due += newHires[bought - 1];
  }
  return due;
}

/**
 * A device for every new position, bought in the month the position is filled (setup), and a
 * replacement for it every replacement cycle (operating). Backfills reuse the leaver's device.
 */
export function hardwareCharges(
  ai: AiInputs,
  plan: HeadcountPlan,
  assumptions: Assumptions,
): Charge[] {
  const meta = plainMeta('hardware', 'technology', 'Hardware', 'Employee hardware');
  const replacement = { ...meta, label: 'Hardware replacement' };
  const tax = assumptions.technologyTaxPct;
  return MONTHS.flatMap((month) => {
    const bought = toMinor(plan.newHires[month - 1] * ai.hardwarePerEmployee);
    const replaced = toMinor(
      devicesDue(plan.newHires, month, ai.hardwareCycleMonths) * ai.hardwarePerEmployee,
    );
    return [
      ...charge(meta, month, 'setup', bought, percentOf(bought, tax)),
      ...charge(replacement, month, 'operating', replaced, percentOf(replaced, tax)),
    ];
  });
}
