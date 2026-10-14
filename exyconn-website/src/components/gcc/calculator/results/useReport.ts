import { intlFormat } from "date-fns";
import { useCallback } from "react";
import {
  buildReport,
  type Estimate,
  type ReportModel,
  type ScenarioOutcome,
} from "@exyconn/gcc-cost";
import { useCalculator } from "../state/CalculatorContext";

/** The report model for an estimate (PDF, print and share text all read it). */
export function useReport() {
  const { locale } = useCalculator();
  return useCallback(
    (
      estimate: Estimate,
      outcomes: readonly ScenarioOutcome[],
      display: "symbol" | "code" = "symbol"
    ): ReportModel =>
      buildReport(estimate, outcomes, {
        locale,
        display,
        generatedOn: intlFormat(new Date(), { dateStyle: "medium" }, { locale }),
      }),
    [locale]
  );
}
