import type { ScenarioSummary } from "@exyconn/gcc-cost";
import { useMoney } from "../state/CalculatorContext";
import { RESULTS } from "../strings/results";
import { UI } from "../strings/ui";

function breakEvenText(summary: ScenarioSummary, hasBenefit: boolean): string {
  if (summary.breakEvenMonth !== null) {
    return RESULTS.breakEvenMonth(summary.breakEvenMonth);
  }
  return hasBenefit ? RESULTS.breakEvenNone : RESULTS.breakEvenNoInput;
}

/** The headline cards: setup, deposits, cash, run-rate, unit cost, totals and horizons. */
export function HeadlineFigures({
  summary,
  hasBenefit,
}: Readonly<{ summary: ScenarioSummary; hasBenefit: boolean }>) {
  const money = useMoney();
  const perEmployee = summary.costPerEmployeeMonthly;
  const presentValue = summary.presentValue;
  const cards = [
    { key: "setup", label: UI.summary.setup, value: money.format(summary.setupCost) },
    { key: "deposits", label: UI.summary.deposits, value: money.format(summary.deposits) },
    { key: "cash", label: UI.summary.initialCash, value: money.format(summary.initialCash) },
    {
      key: "monthly",
      label: UI.summary.monthly(summary.phaseMonth),
      value: money.format(summary.monthlyOperating),
    },
    {
      key: "unit",
      label: UI.summary.perEmployee,
      value: perEmployee === null ? "—" : money.format(perEmployee),
    },
    {
      key: "total",
      label: UI.summary.forecast,
      value: money.format(summary.forecastTotal),
      lead: true,
    },
    { key: "tax", label: RESULTS.tax, value: money.format(summary.tax) },
    { key: "contingency", label: RESULTS.contingency, value: money.format(summary.contingency) },
    { key: "optional", label: RESULTS.optional, value: money.format(summary.optionalTotal) },
    {
      key: "pv",
      label: RESULTS.presentValue,
      value: presentValue === null ? RESULTS.none : money.format(presentValue),
    },
    { key: "breakeven", label: RESULTS.breakEven, value: breakEvenText(summary, hasBenefit) },
  ];
  return (
    <>
      <h3 className="gcc-panel__title">{RESULTS.headline}</h3>
      <dl className="gcc-metrics">
        {cards.map((card) => (
          <div key={card.key} className={card.lead ? "gcc-metric gcc-metric--lead" : "gcc-metric"}>
            <dt>{card.label}</dt>
            <dd>{card.value}</dd>
          </div>
        ))}
      </dl>
      <p className="gcc-lines__note">{UI.summary.preTax}</p>
      <h3 className="gcc-panel__title">{RESULTS.horizons}</h3>
      <dl className="gcc-metrics gcc-metrics--compact">
        {summary.horizonTotals.map((horizon) => (
          <div key={horizon.months} className="gcc-metric">
            <dt>{RESULTS.horizon(horizon.months)}</dt>
            <dd>{money.format(horizon.total)}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}
