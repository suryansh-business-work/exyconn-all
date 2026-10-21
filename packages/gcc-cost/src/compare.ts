import { calculateScenario, type ScenarioResult } from './engine';
import type { Estimate } from './schema';
import { summarise, type ScenarioSummary } from './summary';

export interface ScenarioOutcome {
  result: ScenarioResult;
  summary: ScenarioSummary;
}

/** Every scenario of an estimate, computed and summarised. */
export function calculateEstimate(estimate: Estimate): ScenarioOutcome[] {
  return estimate.scenarios.map((scenario) => {
    const result = calculateScenario(scenario, estimate.fxRates);
    return { result, summary: summarise(result) };
  });
}

export const COMPARED_METRICS = [
  'setupCost',
  'deposits',
  'initialCash',
  'monthlyOperating',
  'costPerEmployeeMonthly',
  'forecastTotal',
] as const;
export type ComparedMetric = (typeof COMPARED_METRICS)[number];

export interface MetricVariance {
  metric: ComparedMetric;
  value: number | null;
  /** Difference from the baseline scenario; null when either side has no value. */
  delta: number | null;
  /** Percentage difference; null when the baseline is zero or missing. */
  deltaPct: number | null;
}

export interface ScenarioComparison {
  scenarioId: string;
  name: string;
  variances: MetricVariance[];
}

function variance(value: number | null, base: number | null): Omit<MetricVariance, 'metric'> {
  if (value === null || base === null) {
    return { value, delta: null, deltaPct: null };
  }
  const delta = value - base;
  return { value, delta, deltaPct: base === 0 ? null : (delta / base) * 100 };
}

/**
 * Each scenario against the baseline (the first). Scenario variance = scenario − baseline, per
 * metric. Forecast totals are only comparable over the same window, so each scenario is compared
 * on its own window — the UI states each window beside the figure.
 */
export function compareScenarios(outcomes: readonly ScenarioOutcome[]): ScenarioComparison[] {
  const [baseline] = outcomes;
  return outcomes.map(({ result, summary }) => ({
    scenarioId: result.scenario.id,
    name: result.scenario.name,
    variances: COMPARED_METRICS.map((metric) => ({
      metric,
      ...variance(summary[metric], baseline.summary[metric]),
    })),
  }));
}
