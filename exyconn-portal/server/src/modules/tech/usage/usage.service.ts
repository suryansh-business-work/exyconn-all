import { runAsPlatform } from '../../../lib/tenant';
import { badRequest } from '../../../utils/errors';
import { computeCostUsd, priceForModel, type ModelPrice } from '../../ai/ai.pricing';
import { usageDay } from './usage.meter';
import {
  INTEGRATION_PROVIDERS,
  IntegrationUsageModel,
  type IntegrationProvider,
} from './usage.model';

/** The longest window a dashboard asks for. */
export const MAX_USAGE_DAYS = 366;

const DAY_MS = 24 * 60 * 60 * 1000;

/** One row of counts, with what it cost at today's prices (OpenAI only; others are 0). */
export interface UsageTotals {
  calls: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

export interface IntegrationUsageSummary extends UsageTotals {
  provider: IntegrationProvider;
  days: Array<UsageTotals & { day: string }>;
  actions: Array<UsageTotals & { action: string }>;
}

interface UsageRow {
  provider: IntegrationProvider;
  action: string;
  day: string;
  calls: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
}

const empty = (): UsageTotals => ({
  calls: 0,
  failures: 0,
  inputTokens: 0,
  outputTokens: 0,
  costUsd: 0,
});

function add(into: UsageTotals, row: UsageRow, costUsd: number): void {
  into.calls += row.calls;
  into.failures += row.failures;
  into.inputTokens += row.inputTokens;
  into.outputTokens += row.outputTokens;
  into.costUsd += costUsd;
}

/** The days of the window, oldest first, so a chart has a point for every day — even quiet ones. */
export function windowDays(days: number, today: Date): string[] {
  return Array.from({ length: days }, (_, index) =>
    usageDay(new Date(today.getTime() - (days - 1 - index) * DAY_MS)),
  );
}

/** The price of each OpenAI model the rows name, read once per model. */
async function pricesFor(rows: readonly UsageRow[]): Promise<Map<string, ModelPrice | null>> {
  const models = [...new Set(rows.filter((r) => r.provider === 'OPENAI').map((r) => r.action))];
  const prices = await Promise.all(models.map((model) => priceForModel(model)));
  return new Map(models.map((model, index) => [model, prices[index]]));
}

/** What a row cost: its tokens at the model's price for OpenAI, nothing we can price otherwise. */
function costOf(row: UsageRow, prices: Map<string, ModelPrice | null>): number {
  if (row.provider !== 'OPENAI') {
    return 0;
  }
  return computeCostUsd(
    { promptTokens: row.inputTokens, completionTokens: row.outputTokens },
    prices.get(row.action) ?? null,
  );
}

/** One integration's totals, a point per day of the window and a line per kind of call. */
function summarize(
  provider: IntegrationProvider,
  rows: readonly UsageRow[],
  window: readonly string[],
  prices: Map<string, ModelPrice | null>,
): IntegrationUsageSummary {
  const totals = empty();
  const days = new Map(window.map((day) => [day, { day, ...empty() }]));
  const actions = new Map<string, UsageTotals & { action: string }>();
  for (const row of rows) {
    const cost = costOf(row, prices);
    add(totals, row, cost);
    const day = days.get(row.day);
    if (day) {
      add(day, row, cost);
    }
    const action = actions.get(row.action) ?? { action: row.action, ...empty() };
    add(action, row, cost);
    actions.set(row.action, action);
  }
  return {
    provider,
    ...totals,
    days: [...days.values()],
    actions: [...actions.values()].sort((a, b) => b.calls - a.calls),
  };
}

/**
 * Every integration's usage over the last `days` days (today included), the whole platform's.
 * An integration nobody called still has its row of zeros, so the dashboard lists them all.
 */
export async function integrationUsage(
  days: number,
  today = new Date(),
): Promise<IntegrationUsageSummary[]> {
  if (!Number.isInteger(days) || days < 1 || days > MAX_USAGE_DAYS) {
    badRequest(`Ask for 1 to ${MAX_USAGE_DAYS} days of usage.`);
  }
  const window = windowDays(days, today);
  const rows = await runAsPlatform(() =>
    IntegrationUsageModel.find({ day: { $gte: window[0] } })
      .select('provider action day calls failures inputTokens outputTokens')
      .lean<UsageRow[]>(),
  );
  const prices = await pricesFor(rows);
  return INTEGRATION_PROVIDERS.map((provider) =>
    summarize(
      provider,
      rows.filter((row) => row.provider === provider),
      window,
      prices,
    ),
  );
}
