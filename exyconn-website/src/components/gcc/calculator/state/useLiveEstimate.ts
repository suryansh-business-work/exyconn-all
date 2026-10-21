import { useEffect, useMemo, useRef, useState } from "react";
import { useWatch, type Control } from "react-hook-form";
import {
  calculateEstimate,
  estimateSchema,
  type Estimate,
  type ScenarioOutcome,
} from "@exyconn/gcc-cost";

const RECALC_DELAY_MS = 120;

/** Each input's total (with tax) inside its scenario's window, so a row reads one number. */
function totalsBySource(outcome: ScenarioOutcome): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of outcome.result.charges) {
    if (item.month <= outcome.summary.forecastMonths) {
      totals.set(item.sourceId, (totals.get(item.sourceId) ?? 0) + item.amount + item.tax);
    }
  }
  return totals;
}

/**
 * The estimate as the form holds it right now, validated and computed. Totals update a moment
 * after each change; while an input is invalid the last valid totals stay on screen (marked
 * stale) instead of computing from a half-typed number.
 */
export function useLiveEstimate(control: Control<Estimate>) {
  const values = useWatch({ control });
  const [settled, setSettled] = useState(values);
  useEffect(() => {
    const timer = globalThis.setTimeout(() => setSettled(values), RECALC_DELAY_MS);
    return () => globalThis.clearTimeout(timer);
  }, [values]);

  const parsed = useMemo(() => estimateSchema.safeParse(settled), [settled]);
  const lastValid = useRef<Estimate | null>(null);
  if (parsed.success) {
    lastValid.current = parsed.data;
  }
  const estimate = lastValid.current;
  const outcomes = useMemo(() => (estimate ? calculateEstimate(estimate) : []), [estimate]);
  const sourceTotals = useMemo(() => outcomes.map(totalsBySource), [outcomes]);
  const issueCount = parsed.success ? 0 : parsed.error.issues.length;
  return useMemo(
    () => ({ estimate, outcomes, sourceTotals, valid: parsed.success, issueCount }),
    [estimate, outcomes, sourceTotals, parsed.success, issueCount]
  );
}

export type LiveEstimate = ReturnType<typeof useLiveEstimate>;
