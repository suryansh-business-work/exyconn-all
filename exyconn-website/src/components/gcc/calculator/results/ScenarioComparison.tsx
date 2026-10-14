import { compareScenarios, type MetricVariance } from "@exyconn/gcc-cost";
import { useCalculator, useMoney } from "../state/CalculatorContext";
import { METRIC_LABELS, RESULTS } from "../strings/results";

function deltaText(variance: MetricVariance, format: (minor: number) => string, locale: string) {
  if (variance.delta === null) {
    return "";
  }
  const sign = variance.delta > 0 ? "+" : "";
  const pct =
    variance.deltaPct === null
      ? ""
      : ` (${sign}${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(variance.deltaPct)}%)`;
  return `${sign}${format(variance.delta)}${pct}`;
}

/** Every scenario side by side, with its difference from the first (baseline) scenario. */
export function ScenarioComparison() {
  const { live, locale } = useCalculator();
  const money = useMoney();
  const comparisons = compareScenarios(live.outcomes);
  const metrics = comparisons[0]?.variances.map((variance) => variance.metric) ?? [];
  return (
    <>
      <p className="gcc-lines__note">{RESULTS.comparisonNote}</p>
      <div className="gcc-table-scroll" tabIndex={0} role="region" aria-label={RESULTS.comparison}>
        <table className="gcc-compare">
          <thead>
            <tr>
              <th scope="col">{RESULTS.comparison}</th>
              {comparisons.map((comparison, index) => (
                <th key={comparison.scenarioId} scope="col">
                  {comparison.name}
                  {index === 0 && <span className="gcc-compare__base"> · {RESULTS.baseline}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric) => (
              <tr key={metric}>
                <th scope="row">{METRIC_LABELS[metric]}</th>
                {comparisons.map((comparison, index) => {
                  const variance = comparison.variances.find((item) => item.metric === metric);
                  const value = variance?.value;
                  return (
                    <td key={comparison.scenarioId}>
                      <span>
                        {value === null || value === undefined ? "—" : money.format(value)}
                      </span>
                      {index > 0 && variance && (
                        <span className="gcc-compare__delta">
                          {deltaText(variance, money.format, locale)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
