import type { Interpolations } from '@exyconn/i18n';
import type { StatItem } from '@exyconn/shell/components/dashboard/StatCard';
import { statSum, type TableStatsShape } from '@exyconn/shell/components/data/tableStats';
import { formatMoney } from '@exyconn/shell/utils/money';

type Translate = (source: string, values?: Interpolations) => string;

/** The currencies campaign budgets are set in, read from the stats' `budgetCurrency` count. */
function budgetCurrencies(stats: TableStatsShape | null | undefined): string[] {
  const counts = stats?.counts.find((entry) => entry.field === 'budgetCurrency');
  return counts?.buckets.map((bucket) => bucket.value) ?? [];
}

/**
 * The "Total budget" tile. Budgets in one currency add up to a total in it (the company's
 * when there are none yet); budgets in several are not added together, because a sum of
 * rupees and dollars is no amount of either.
 */
export function totalBudgetStat(
  stats: TableStatsShape | null | undefined,
  t: Translate,
  accent: string,
): StatItem {
  const currencies = budgetCurrencies(stats);
  if (currencies.length > 1) {
    return {
      label: 'Total budget',
      value: t('{count} currencies', { count: currencies.length }),
      info: 'Campaign budgets are set in more than one currency, so they are not added into one total. The Budget column shows each campaign in its own currency.',
      accent,
    };
  }
  return {
    label: 'Total budget',
    value: formatMoney(statSum(stats, 'budget'), currencies[0]),
    accent,
  };
}
